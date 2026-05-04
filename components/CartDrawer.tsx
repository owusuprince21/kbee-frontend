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

/* ---------- identity helpers ---------- */
type AnyRec = Record<string, any>;
function extractUserIdentity(u: unknown) {
  const anyU = (u || {}) as AnyRec;
  const uid = anyU.uid ?? anyU.id ?? anyU.firebase_uid ?? null;
  const email = anyU.email ?? null;
  const name = anyU.displayName ?? anyU.full_name ?? anyU.name ?? null;
  const photo = anyU.photoURL ?? anyU.photo_url ?? null;
  return { uid, email, name, photo };
}
function buildFirebaseHeaders(user: unknown): HeadersInit {
  const { uid, email, name, photo } = extractUserIdentity(user);
  const h: Record<string, string> = {};
  if (uid != null) h['X-Firebase-UID'] = String(uid);
  if (email) h['X-User-Email'] = String(email);
  if (name) h['X-User-Name'] = String(name);
  if (photo) h['X-User-Photo'] = String(photo);
  return h;
}
const toNum = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

/* ---------- server cart types ---------- */
type ServerProduct = {
  id: number;
  name: string;
  slug: string;
  price?: string | number;
  discount_price?: string | number | null;
  images?: { image?: string | null }[];
  main_image_url?: string | null;
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
  const { user } = useAuthStore();

  // local store only used for one-time migration
  const localStore = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cart, setCart] = useState<ServerCart | null>(null);
  const didSyncRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const headers = useMemo(() => buildFirebaseHeaders(user), [user]);

  const fetchServerCart = async () => {
    const data = await http<ServerCart>('/api/cart/', { headers });
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
          body: { product: productId, quantity: qty },
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

  // When the drawer opens, load cart and (once) migrate local items
  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setLoading(true);
      try {
        await fetchServerCart();
        await migrateLocalToServer();
        await fetchServerCart();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  // server-backed actions
  const changeQty = async (itemId: number, qty: number) => {
    qty = Math.max(1, qty);
    const data = await http<ServerCart>(`/api/cart/update_item/${itemId}/`, {
      method: 'PATCH',
      headers,
      body: { quantity: qty },
    });
    setCart(data);
  };

  const removeItem = async (itemId: number) => {
    const data = await http<ServerCart>(`/api/cart/remove_item/${itemId}/`, {
      method: 'DELETE',
      headers,
    });
    setCart(data);
  };

  const clearServerCart = async () => {
    await http('/api/cart/clear/', { method: 'POST', headers });
    await fetchServerCart();
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
            ) : !user ? (
              <div className="grid place-items-center py-16 text-center text-gray-600">
                <p>Please sign in to use your cart.</p>
              </div>
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
                const img =
                  p?.images?.[0]?.image || p?.main_image_url || '/placeholder.jpg';

                return (
                  <div key={item.id} className="flex gap-4 rounded-lg border p-3">
                    <Link
                      href={`/product/${p?.slug}`}
                      onClick={onClose}
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded"
                    >
                      <Image src={img} alt={p?.name || 'Product'} fill className="object-cover" />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${p?.slug}`}
                        onClick={onClose}
                        className="line-clamp-2 font-semibold hover:text-yellow-600"
                      >
                        {p?.name || 'Item'}
                      </Link>

                      <div className="mt-1 flex items-center gap-2">
                        {typeof discount === 'number' && discount < price ? (
                          <>
                            <span className="font-bold text-yellow-600">
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
                          onClick={() => changeQty(item.id, Math.max(1, toNum(item.quantity) - 1))}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-semibold">
                          {Math.max(1, toNum(item.quantity))}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => changeQty(item.id, toNum(item.quantity) + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>

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
              <span className="text-yellow-600">{formatGHS(subtotal)}</span>
            </div>

            <div className="flex gap-2">
              <Link href="/cart" className="flex-1" onClick={onClose}>
                <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-600">
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
