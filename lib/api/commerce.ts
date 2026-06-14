'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, type Paginated } from './http';

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
  wishlist: ['commerce', 'wishlist'] as const,
};

export function useCartQuery() {
  return useQuery({
    queryKey: commerceKeys.cart,
    queryFn: async () => {
      try {
        return await http<ApiCart>('/api/cart/');
      } catch {
        return emptyCart;
      }
    },
    retry: false,
  });
}

export function useAddToCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: number; quantity?: number }) =>
      http<ApiCart>('/api/cart/add_item/', {
        method: 'POST',
        body: { product_id: productId, quantity },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commerceKeys.cart });
      window.dispatchEvent(new Event('cart:updated'));
    },
  });
}

export function useWishlistQuery() {
  return useQuery({
    queryKey: commerceKeys.wishlist,
    queryFn: async () => {
      let data: ApiWishlistItem[] | Paginated<ApiWishlistItem>;
      try {
        data = await http<ApiWishlistItem[] | Paginated<ApiWishlistItem>>('/api/wishlist/');
      } catch {
        return [];
      }
      return Array.isArray((data as Paginated<ApiWishlistItem>)?.results)
        ? (data as Paginated<ApiWishlistItem>).results
        : (data as ApiWishlistItem[]);
    },
    retry: false,
  });
}

export function useAddToWishlistMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) =>
      http<ApiWishlistItem>('/api/wishlist/', {
        method: 'POST',
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
  return useMutation({
    mutationFn: (productId: number) =>
      http<void>(`/api/wishlist/by-product/${productId}/`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commerceKeys.wishlist });
      window.dispatchEvent(new Event('wishlist:updated'));
    },
  });
}
