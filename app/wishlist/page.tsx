'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/currencyformat';

import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { http, type Paginated } from '@/lib/api/http';

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

/* ---------- types aligned with WishlistItemSerializer ---------- */
type UiImage = { image?: string | null };
type UiProduct = {
  id: number;
  slug: string;
  name: string;
  price: string | number;
  discount_price?: string | number | null;
  is_in_stock?: boolean;
  images?: UiImage[];
};
type UiWishlistItem = {
  id: number;
  product: UiProduct;
  added_at?: string;
};

export default function WishlistPage() {
  const { user } = useAuthStore();

  // local-store fallbacks (guest mode)
  const localWishlist = useWishlistStore();
  const addToCartLocal = useCartStore((s) => s.addItem);

  // server-driven state
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UiWishlistItem[]>([]);

  const isSignedIn = useMemo(() => !!extractUserIdentity(user).uid, [user]);

  const fetchServerWishlist = useCallback(async () => {
    if (!isSignedIn) {
      // guest fallback: mirror local store
      setItems(
        localWishlist.items.map((w) => ({
          id: Number(w.id),
          product: w.product as unknown as UiProduct,
          added_at: w.added_at,
        }))
      );
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const headers = buildFirebaseHeaders(user);
      const res = await http<UiWishlistItem[] | Paginated<UiWishlistItem>>('/api/wishlist/', { headers });
      const list = Array.isArray((res as Paginated<UiWishlistItem>)?.results)
        ? (res as Paginated<UiWishlistItem>).results
        : (res as UiWishlistItem[]);
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user, localWishlist.items]);

  useEffect(() => {
    fetchServerWishlist();
  }, [fetchServerWishlist]);

  // react to external updates (e.g., ProductCard toggles)
  useEffect(() => {
    const onUpdated = () => fetchServerWishlist();
    window.addEventListener('wishlist:updated', onUpdated);
    return () => window.removeEventListener('wishlist:updated', onUpdated);
  }, [fetchServerWishlist]);

  const handleAddToCart = async (product: UiProduct) => {
    try {
      if (!isSignedIn) {
        addToCartLocal(product as any);
        toast.message('Added locally. Sign in to sync your cart.');
        return;
      }
      const headers = buildFirebaseHeaders(user);
      await http('/api/cart/add_item/', {
        method: 'POST',
        headers,
        body: { product: product.id, quantity: 1 },
      });
      toast.success('Added to cart!');
      window.dispatchEvent(new Event('cart:updated'));
    } catch {
      toast.error('Could not add to cart.');
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      if (!isSignedIn) {
        localWishlist.removeItem(productId);
        setItems((prev) => prev.filter((it) => it.product.id !== productId));
        return;
      }
      const headers = buildFirebaseHeaders(user);
      await http(`/api/wishlist/by-product/${productId}/`, {
        method: 'DELETE',
        headers,
      });
      setItems((prev) => prev.filter((it) => it.product.id !== productId));
      toast.success('Removed from wishlist.');
      window.dispatchEvent(new Event('wishlist:updated'));
    } catch {
      toast.error('Could not remove item.');
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    if (!isSignedIn) {
      localWishlist.clearWishlist();
      setItems([]);
      return;
    }
    try {
      const headers = buildFirebaseHeaders(user);
      await Promise.allSettled(
        items.map((it) =>
          http(`/api/wishlist/by-product/${it.product.id}/`, {
            method: 'DELETE',
            headers,
          })
        )
      );
      setItems([]);
      toast.success('Wishlist cleared.');
      window.dispatchEvent(new Event('wishlist:updated'));
    } catch {
      toast.error('Could not clear wishlist.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="mb-4 text-3xl font-bold">Your Wishlist</h1>
        {/* 2 on mobile, 5 on desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold">Your Wishlist</h1>
        <p className="mb-6 text-gray-600">Your wishlist is empty</p>
        <Link href="/shop">
          <Button className="bg-yellow-500 text-black hover:bg-yellow-600">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Wishlist</h1>
        <Button variant="destructive" onClick={handleClearAll} size="sm">
          Clear Wishlist
        </Button>
      </div>

      {/* 2 on mobile, 5 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => {
          const p = item.product;
          const price = Number(p.price) || 0;
          const discount =
            p.discount_price != null ? Number(p.discount_price as any) : undefined;
          const hasDiscount = typeof discount === 'number' && discount < price;

          const cover = p.images?.[0]?.image || '/placeholder.jpg';

          return (
            <div
              key={item.id}
              className="relative flex flex-col overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Remove button */}
              <button
                onClick={() => handleRemove(p.id)}
                className="absolute right-2 top-2 z-20 rounded-full bg-white/90 p-1.5 transition-colors hover:bg-red-50"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>

              {/* Image + STOCK BADGE OVERLAY */}
              <Link href={`/product/${p.slug}`} className="relative block h-40 sm:h-44">
                <Image
                  src={cover}
                  alt={p.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />

                {/* Stock pill overlay - top-left, single line */}
                <span
                  className={[
                    'absolute left-2 top-2 z-10 rounded',
                    'px-2 py-0.5 text-[11px] sm:text-xs font-semibold',
                    'whitespace-nowrap',
                    p.is_in_stock
                      ? 'bg-green-100 text-green-800 ring-1 ring-green-200'
                      : 'bg-red-100 text-red-800 ring-1 ring-red-200',
                  ].join(' ')}
                >
                  {p.is_in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
              </Link>

              {/* Body */}
              <div className="p-3">
                <Link href={`/product/${p.slug}`}>
                  <h3
                    className="mb-2 line-clamp-2 text-[13px] font-semibold leading-[1.25] pb-[1px] sm:text-sm hover:text-yellow-600"
                    title={p.name}
                  >
                    {p.name}
                  </h3>
                </Link>

                {/* Prices: stacked; no stock chip here anymore */}
                <div className="mb-2 flex items-start">
                  {hasDiscount ? (
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-400 line-through leading-none">
                        {formatGHS(price)}
                      </span>
                      <span className="mt-1 text-lg font-bold text-yellow-600">
                        {formatGHS(discount)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      {formatGHS(price)}
                    </span>
                  )}
                </div>

                {p.is_in_stock && (
                  <Button
                    onClick={() => handleAddToCart(p)}
                    className="h-9 w-full bg-yellow-500 text-sm text-black hover:bg-yellow-600"
                    size="sm"
                  >
                    Add to Cart
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
