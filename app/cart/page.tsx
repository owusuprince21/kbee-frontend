'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatGHS } from '@/lib/currencyformat';
import { http } from '@/lib/api/http';
import { commerceKeys } from '@/lib/api/commerce';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

function normalizeHttps(u?: string | null): string | undefined {
  if (!u) return u ?? undefined;
  try {
    const url = new URL(u);
    url.protocol = 'https:';
    return url.toString();
  } catch {
    if (u.startsWith('//')) return `https:${u}`;
    if (u.startsWith('http://')) return `https://${u.slice('http://'.length)}`;
    return u;
  }
}
function productImageSrc(p?: ServerProduct): string {
  const candidate =
    p?.images?.find(i => i?.image)?.image ??
    p?.main_image_url ??
    '/placeholder.jpg';
  const normalized = normalizeHttps(candidate);
  return normalized || '/placeholder.jpg';
}

type ServerProduct = {
  id: number;
  name: string;
  slug: string;
  price?: string | number;
  discount_price?: string | number | null;
  images?: { image?: string | null }[];
  main_image_url?: string | null;
  stock_quantity?: number | string;
  is_in_stock?: boolean;
};
type ServerCartItem = {
  id: number;
  product: ServerProduct;
  quantity: number;
  unit_price: string | number;
  added_at: string;
};
type ServerCart = {
  id: number;
  items: ServerCartItem[];
  subtotal?: string | number;
};

const emptyCart: ServerCart = { id: 0, items: [], subtotal: '0.00' };
const CHECKOUT_CART_SNAPSHOT_KEY = 'kbee_checkout_cart_snapshot';

const toNum = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

function stockLimit(product?: ServerProduct) {
  if (product?.stock_quantity === undefined || product?.stock_quantity === null || product?.stock_quantity === '') {
    return null;
  }
  const stock = Number(product?.stock_quantity ?? 0);
  if (product?.is_in_stock === false) return 0;
  return Number.isFinite(stock) && stock > 0 ? Math.floor(stock) : 0;
}

export default function CartPage() {
  const { user, hasHydrated, authReady } = useAuthStore();
  const localCart = useCartStore();
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<ServerCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const headers = useMemo<HeadersInit>(() => ({}), []);
  const allowGuestRequests = !user;
  const publishCart = (nextCart: ServerCart) => {
    setCart(nextCart);
    queryClient.setQueriesData({ queryKey: commerceKeys.cart }, nextCart);
    window.dispatchEvent(new Event(nextCart.items?.length ? 'cart:updated' : 'cart:cleared'));
  };

  const fetchServerCart = async () => {
    try {
      const data = await http<ServerCart>('/api/cart/', { headers, allowGuest: allowGuestRequests });
      publishCart(data);
      return data;
    } catch {
      publishCart(emptyCart);
      return emptyCart;
    }
  };

  const migrateLocalToServer = async () => {
    const items = localCart.items || [];
    if (!items.length) return;

    setSyncing(true);
    try {
      const serverCart = await fetchServerCart();
      const current = serverCart ? [...serverCart.items] : [];

      for (const it of items) {
        const productId = it.product?.id;
        const qty = Math.max(1, Number(it.quantity || 1));
        if (!productId || !qty) continue;

        const existing = current.find(ci => ci.product?.id === productId);
        if (existing) {
          await http<ServerCart>(`/api/cart/update_item/${existing.id}/`, {
            method: 'PATCH',
            headers,
            allowGuest: allowGuestRequests,
            body: { quantity: qty },
          });
        } else {
          await http<ServerCart>('/api/cart/add_item/', {
            method: 'POST',
            headers,
            allowGuest: allowGuestRequests,
            body: { product: productId, quantity: qty },
          });
        }
      }

      await fetchServerCart();
      localCart.clearCart();
      try { localStorage.removeItem('cart-storage'); } catch {}
      window.dispatchEvent(new Event('cart:updated'));
      toast.success('Cart synced to your account.');
    } catch {
      toast.error('Could not sync your cart. Still showing local items.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!hasHydrated || (user && !authReady)) {
        setLoading(true);
        return;
      }
      setLoading(true);
      try {
        await fetchServerCart();
        if (user) await migrateLocalToServer();
        await fetchServerCart();
      } catch {
        publishCart(emptyCart);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, hasHydrated, user]);

  const grandSubtotal = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce(
      (acc, it) => acc + toNum(it.unit_price) * Math.max(1, toNum(it.quantity)),
      0
    );
  }, [cart]);

  const changeQty = async (itemId: number, qty: number, maxQty?: number | null) => {
    if (qty < 1) qty = 1;
    if (maxQty != null && maxQty > 0) qty = Math.min(qty, maxQty);
    try {
      const data = await http<ServerCart>(`/api/cart/update_item/${itemId}/`, {
        method: 'PATCH',
        headers,
        allowGuest: allowGuestRequests,
        body: { quantity: qty },
      });
      publishCart(data);
    } catch {
      toast.error('Could not update cart.');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      const data = await http<ServerCart>(`/api/cart/remove_item/${itemId}/`, {
        method: 'DELETE',
        headers,
        allowGuest: allowGuestRequests,
      });
      publishCart(data);
    } catch {
      toast.error('Could not remove item.');
    }
  };

  const clearServerCart = async () => {
    try {
      await http<{ detail: string }>('/api/cart/clear/', { method: 'POST', headers, allowGuest: allowGuestRequests });
      publishCart(emptyCart);
      await fetchServerCart();
    } catch {
      toast.error('Could not clear cart.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-xl w-full px-4 py-12 sm:py-20 text-center">
        <h1 className="mb-6 text-2xl font-bold sm:text-4xl">Your Cart</h1>
        <p className="text-gray-600">{syncing ? 'Syncing your cart…' : 'Loading…'}</p>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const prepareCheckoutSnapshot = () => {
    try {
      if (cart?.items?.length) {
        localStorage.setItem(CHECKOUT_CART_SNAPSHOT_KEY, JSON.stringify(cart));
      }
    } catch {}
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-screen-xl w-full px-4 py-12 sm:py-20 text-center">
        <h1 className="mb-6 text-2xl font-bold sm:text-4xl">Your Cart</h1>
        <p className="mb-8 text-gray-600">Your cart is empty</p>
        <Link href="/shop">
          <Button className="bg-amber-600 text-white hover:bg-amber-700">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="
        mx-auto max-w-screen-xl w-full
        px-3 sm:px-4 py-4 sm:py-8
        lg:grid lg:grid-cols-3 lg:gap-8
        overflow-x-hidden
      "
    >
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-3">
        <h1 className="text-2xl font-bold sm:text-4xl">Your Cart</h1>
        <Button variant="destructive" onClick={clearServerCart} className="w-full sm:w-auto">
          Clear Shopping Cart
        </Button>
      </div>

      {/* Items (no inner scroll; page scrolls) */}
      <div className="space-y-4 lg:col-span-2 min-w-0">
        {items.map((item) => {
          const p = item.product;
          const price = toNum(p?.price);
          const discount = p?.discount_price != null ? toNum(p.discount_price) : undefined;
          const perUnit =
            typeof discount === 'number' && !Number.isNaN(discount) && discount < price
              ? discount
              : price || toNum(item.unit_price);
          const lineTotal = perUnit * Math.max(1, toNum(item.quantity));
          const maxQty = stockLimit(p);
          const currentQty = Math.max(1, toNum(item.quantity));
          const atMaxStock = maxQty != null && maxQty > 0 && currentQty >= maxQty;
          const outOfStock = maxQty === 0 || p?.is_in_stock === false;

          const dec = () => changeQty(item.id, Math.max(1, currentQty - 1), maxQty);
          const inc = () => {
            if (atMaxStock || outOfStock) return;
            changeQty(item.id, currentQty + 1, maxQty);
          };
          const onType = (e: React.ChangeEvent<HTMLInputElement>) => {
            const n = Math.max(1, Math.floor(Number(e.target.value)));
            if (Number.isFinite(n)) changeQty(item.id, n, maxQty);
          };
          const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            if (!e.target.value || Number(e.target.value) < 1) changeQty(item.id, 1, maxQty);
          };

          const img = productImageSrc(p);

          return (
            <div
              key={item.id}
              className="
                rounded-lg bg-white p-3 sm:p-4 md:p-6 shadow-md
                grid grid-cols-[84px_1fr] sm:grid-cols-[100px_1fr] gap-3 sm:gap-4 md:gap-6
                min-w-0
              "
            >
              {/* Image */}
              <Link href={`/product/${p?.slug}`} className="relative shrink-0">
                <div className="h-[84px] w-[84px] sm:h-[100px] sm:w-[100px] overflow-hidden rounded bg-gray-50">
                  <img
                    src={img}
                    alt={p?.name || 'Product'}
                    className="h-full w-full object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg'; }}
                  />
                </div>
              </Link>

              {/* Content */}
              <div className="min-w-0">
                <Link href={`/product/${p?.slug}`}>
                  <h3
                    className="
                      mb-2 font-semibold transition-colors hover:text-amber-600
                      text-sm sm:text-base md:text-lg
                      truncate sm:line-clamp-2 break-words
                    "
                    title={p?.name || 'Item'}
                  >
                    {p?.name || 'Item'}
                  </h3>
                </Link>

                {/* Price */}
                <div className="mb-3 sm:mb-4 flex items-center gap-2">
                  {typeof discount === 'number' && discount < price ? (
                    <>
                      <span className="text-lg sm:text-2xl font-bold text-amber-600">
                        {formatGHS(discount)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400 line-through">
                        {formatGHS(price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg sm:text-2xl font-bold text-gray-900">
                      {formatGHS(perUnit)}
                    </span>
                  )}
                </div>

                {/* Controls — wraps on mobile, nothing gets clipped */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Qty */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={dec}
                      disabled={toNum(item.quantity) <= 1}
                      aria-label="Decrease quantity"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={maxQty || undefined}
                      step={1}
                      className="w-14 sm:w-20 text-center"
                      value={currentQty}
                      onChange={onType}
                      onBlur={onBlur}
                      aria-label="Quantity"
                    />

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={inc}
                      disabled={atMaxStock || outOfStock}
                      title={atMaxStock ? `Only ${maxQty} in stock` : undefined}
                      aria-label="Increase quantity"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {maxQty != null && maxQty > 0 && (
                    <span className="text-xs font-medium text-gray-500">
                      {currentQty >= maxQty ? `Max stock reached (${maxQty})` : `${maxQty} in stock`}
                    </span>
                  )}

                  {/* Line total + delete */}
                  <div className="ml-auto flex items-center gap-2">
                    <p className="text-base sm:text-lg font-bold whitespace-nowrap">
                      {formatGHS(lineTotal)}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-700 shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md lg:sticky lg:top-24">
          <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Order Summary</h2>

          <div className="mb-6 space-y-3 sm:space-y-4">
            {items.map((item) => {
              const p = item.product;
              const price = toNum(p?.price);
              const discount = p?.discount_price != null ? toNum(p.discount_price) : undefined;
              const perUnit =
                typeof discount === 'number' && discount < price
                  ? discount
                  : price || toNum(item.unit_price);
              const lineTotal = perUnit * Math.max(1, toNum(item.quantity));
              return (
                <div key={item.id} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="max-w-[65%] truncate text-gray-600" title={p?.name || 'Item'}>
                    {p?.name || 'Item'} × {toNum(item.quantity)}
                  </span>
                  <span className="font-semibold whitespace-nowrap text-right">
                    {formatGHS(lineTotal)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mb-6 border-t pt-4">
            <div className="flex items-center justify-between gap-2 text-lg sm:text-xl font-bold">
              <span>Grand Total:</span>
              <span className="text-amber-600 whitespace-nowrap text-right">
                {formatGHS(grandSubtotal)}
              </span>
            </div>
          </div>

          <Link href="/checkout" className="block" onClick={prepareCheckoutSnapshot}>
            <Button className="w-full bg-amber-600 text-white hover:bg-amber-700">
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
