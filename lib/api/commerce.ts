'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, type Paginated } from './http';
import { useAuthStore } from '@/store/authStore';

export type ApiCartItem = {
  id: number;
  product: any;
  quantity: number;
  unit_price: string | number;
  subtotal?: string | number;
};

export type ApiCart = {
  id: number;
  items: ApiCartItem[];
  subtotal?: string | number;
};

const emptyCart: ApiCart = {
  id: 0,
  items: [],
  subtotal: '0.00',
};

export type ApiWishlistItem = {
  id: number;
  product: any;
  added_at?: string;
};

export const commerceKeys = {
  cart: ['commerce', 'cart'] as const,
  cartFor: (owner: string) => ['commerce', 'cart', owner] as const,
  wishlist: ['commerce', 'wishlist'] as const,
  wishlistFor: (owner: string) => ['commerce', 'wishlist', owner] as const,
};

export function useCartQuery() {
  const { user, hasHydrated, authReady } = useAuthStore();
  const userKey = user as any;
  const owner = user ? `user:${userKey.uid || user.id || user.email || 'account'}` : 'guest';
  const allowGuest = !user;

  return useQuery({
    queryKey: commerceKeys.cartFor(owner),
    queryFn: async () => {
      try {
        return await http<ApiCart>('/api/cart/', { allowGuest });
      } catch {
        return emptyCart;
      }
    },
    enabled: hasHydrated && (!user || authReady),
    retry: false,
  });
}

export function useAddToCartMutation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const allowGuest = !user;
  return useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: number; quantity?: number }) =>
      http<ApiCart>('/api/cart/add_item/', {
        method: 'POST',
        allowGuest,
        body: { product_id: productId, quantity },
      }),
    onSuccess: (cart) => {
      qc.setQueriesData({ queryKey: commerceKeys.cart }, cart);
      qc.invalidateQueries({ queryKey: commerceKeys.cart });
      window.dispatchEvent(new Event('cart:updated'));
    },
  });
}

export function useWishlistQuery() {
  const { user, hasHydrated, authReady } = useAuthStore();
  const userKey = user as any;
  const owner = user ? `user:${userKey.uid || user.id || user.email || 'account'}` : 'guest';
  const allowGuest = !user;

  return useQuery({
    queryKey: commerceKeys.wishlistFor(owner),
    queryFn: async () => {
      let data: ApiWishlistItem[] | Paginated<ApiWishlistItem>;
      try {
        data = await http<ApiWishlistItem[] | Paginated<ApiWishlistItem>>('/api/wishlist/', { allowGuest });
      } catch {
        return [];
      }
      return Array.isArray((data as Paginated<ApiWishlistItem>)?.results)
        ? (data as Paginated<ApiWishlistItem>).results
        : (data as ApiWishlistItem[]);
    },
    enabled: hasHydrated && (!user || authReady),
    retry: false,
  });
}

export function useAddToWishlistMutation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const allowGuest = !user;
  return useMutation({
    mutationFn: (productId: number) =>
      http<ApiWishlistItem>('/api/wishlist/', {
        method: 'POST',
        allowGuest,
        body: { product_id: productId },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commerceKeys.wishlist });
      window.dispatchEvent(new Event('wishlist:updated'));
    },
  });
}

export function useRemoveWishlistProductMutation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const allowGuest = !user;
  return useMutation({
    mutationFn: (productId: number) =>
      http<void>(`/api/wishlist/by-product/${productId}/`, { method: 'DELETE', allowGuest }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commerceKeys.wishlist });
      window.dispatchEvent(new Event('wishlist:updated'));
    },
  });
}
