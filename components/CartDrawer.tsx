// components/CartDrawer.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { useCartStore } from '@/store/cartStore'; // only for one-time migration
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/currencyformat';
import { http } from '@/lib/api/http';

type Props = { isOpen: boolean; onClose: () => void };

const toNum = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);
function stockLimit(product?: ServerProduct) {
  if (product?.stock_quantity === undefined || product?.stock_quantity === null || product?.stock_quantity === '') {
    return null;
  }
  const stock = Number(product?.stock_quantity ?? 0);
  if (product?.is_in_stock === false) return 0;
  return Number.isFinite(stock) && stock > 0 ? Math.floor(stock) : 0;
}

/* ---------- server cart types ---------- */
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
type ServerCart = { id: number; items: ServerCartItem[]; subtotal?: string | number };

export default function CartDrawer({ isOpen, onClose }: Props) {
  const { user, hasHydrated, authReady } = useAuthStore();

  // local store only used for one-time migration
  const localStore = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cart, setCart] = useState<ServerCart | null>(null);
  const didSyncRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const headers = useMemo<HeadersInit>(() => ({}), []);
  const allowGuestRequests = !user;

  const fetchServerCart = async () => {
    const data = await http<ServerCart>('/api/cart/', { headers, allowGuest: allowGuestRequests });
    setCart(data);
  };

  // Migrate any local items to DB (run once per session when drawer first opens)
  const migrateLocalToServer = async () => {
    if (didSyncRef.current) return;
    const items = localStore.items || [];
    if (!items.length) return;

    setSyncing(true);
    try {
      for (const it of items) {
        const productId = it.product?.id;
        const qty = Math.max(1, toNum(it.quantity || 1));
        if (!productId || !qty) continue;
        await http('/api/cart/add_item/', {
          method: 'POST',
          headers,
          allowGuest: allowGuestRequests,
          body: { product_id: productId, quantity: qty },
        });
      }
      await fetchServerCart();
      localStore.clearCart();
      try {
        localStorage.removeItem('cart-storage');
      } catch {}
      didSyncRef.current = true;
      toast.success('Cart synced to your account.');
    } catch {
      // Ignore quietly; you’ll still see local items elsewhere if needed
    } finally {
      setSyncing(false);
    }
  };

  // When the drawer opens, load cart and migrate local items for signed-in users.
  useEffect(() => {
    if (!isOpen) return;
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
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, hasHydrated, isOpen, user]);

  // server-backed actions
  const changeQty = async (itemId: number, qty: number, maxQty?: number | null) => {
    qty = Math.max(1, qty);
    if (maxQty != null && maxQty > 0) qty = Math.min(qty, maxQty);
    const data = await http<ServerCart>(`/api/cart/update_item/${itemId}/`, {
      method: 'PATCH',
      headers,
      allowGuest: allowGuestRequests,
      body: { quantity: qty },
    });
    setCart(data);
    window.dispatchEvent(new Event('cart:updated'));
  };

  const removeItem = async (itemId: number) => {
    const data = await http<ServerCart>(`/api/cart/remove_item/${itemId}/`, {
      method: 'DELETE',
      headers,
      allowGuest: allowGuestRequests,
    });
    setCart(data);
    window.dispatchEvent(new Event(data.items?.length ? 'cart:updated' : 'cart:cleared'));
  };

  const clearServerCart = async () => {
    await http('/api/cart/clear/', { method: 'POST', headers, allowGuest: allowGuestRequests });
    await fetchServerCart();
    window.dispatchEvent(new Event('cart:cleared'));
  };

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (acc, it) => acc + toNum(it.unit_price) * Math.max(1, toNum(it.quantity)),
    0
  );

  const skeleton = (
    <div className="space-y-3">
      <div className="h-20 w-full animate-pulse rounded bg-gray-100" />
      <div className="h-20 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-96 max-w-[90vw] transform bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-xl font-bold">Shopping Cart</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(100%-4.5rem)] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {!mounted || loading ? (
              skeleton
            ) : items.length === 0 ? (
              <div className="grid place-items-center py-16 text-center text-gray-600">
                <p>{syncing ? 'Syncing…' : 'Your cart is empty.'}</p>
              </div>
            ) : (
              items.map((item) => {
                const p = item.product;
                const price = toNum(p?.price);
                const discount =
                  p?.discount_price != null ? toNum(p.discount_price) : undefined;
                const perUnit =
                  typeof discount === 'number' && discount < price
                    ? discount
                    : price || toNum(item.unit_price);
                const lineTotal = perUnit * Math.max(1, toNum(item.quantity));
                const maxQty = stockLimit(p);
                const currentQty = Math.max(1, toNum(item.quantity));
                const atMaxStock = maxQty != null && maxQty > 0 && currentQty >= maxQty;
                const outOfStock = maxQty === 0 || p?.is_in_stock === false;
                const img =
                  p?.images?.[0]?.image || p?.main_image_url || '/placeholder.jpg';

                return (
                  <div key={item.id} className="flex gap-4 rounded-lg border p-3">
                    <Link
                      href={`/product/${p?.slug}`}
                      onClick={onClose}
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded"
                    >
                      <Image src={img} alt={p?.name || 'Product'} fill sizes="80px" className="object-cover" />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${p?.slug}`}
                        onClick={onClose}
                        className="line-clamp-2 font-semibold hover:text-amber-600"
                      >
                        {p?.name || 'Item'}
                      </Link>

                      <div className="mt-1 flex items-center gap-2">
                        {typeof discount === 'number' && discount < price ? (
                          <>
                            <span className="font-bold text-amber-600">
                              {formatGHS(discount)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {formatGHS(price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-gray-900">
                            {formatGHS(perUnit)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
	                        <Button
	                          size="icon"
	                          variant="outline"
	                          onClick={() => changeQty(item.id, Math.max(1, currentQty - 1), maxQty)}
	                          disabled={currentQty <= 1}
	                          aria-label="Decrease quantity"
	                        >
                          <Minus className="h-4 w-4" />
                        </Button>
	                        <span className="w-10 text-center font-semibold">
	                          {currentQty}
	                        </span>
	                        <Button
	                          size="icon"
	                          variant="outline"
	                          onClick={() => {
	                            if (atMaxStock || outOfStock) return;
	                            changeQty(item.id, currentQty + 1, maxQty);
	                          }}
	                          disabled={atMaxStock || outOfStock}
	                          title={atMaxStock ? `Only ${maxQty} in stock` : undefined}
	                          aria-label="Increase quantity"
	                        >
	                          <Plus className="h-4 w-4" />
	                        </Button>

	                        {maxQty != null && maxQty > 0 && currentQty >= maxQty && (
	                          <span className="text-xs text-gray-500">Max stock</span>
	                        )}

                        <span className="ml-auto font-semibold">{formatGHS(lineTotal)}</span>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-700"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t p-5">
            <div className="mb-4 flex items-center justify-between text-lg font-bold">
              <span>Subtotal:</span>
              <span className="text-amber-600">{formatGHS(subtotal)}</span>
            </div>

            <div className="flex gap-2">
              <Link href="/cart" className="flex-1" onClick={onClose}>
                <Button className="w-full bg-amber-600 text-white hover:bg-amber-700">
                  View Cart
                </Button>
              </Link>
              <Link href="/checkout" className="flex-1" onClick={onClose}>
                <Button variant="outline" className="w-full">
                  Checkout
                </Button>
              </Link>
            </div>

            {user && items.length > 0 && (
              <Button
                variant="ghost"
                className="mt-3 w-full text-red-600 hover:bg-red-50"
                onClick={clearServerCart}
              >
                Clear Cart
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
