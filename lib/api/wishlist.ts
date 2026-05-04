'use client';

import { http, Paginated } from './http';
import type { WishlistItem } from './types';

export async function listWishlist(params?: { page?: number; page_size?: number }) {
  return http<Paginated<WishlistItem>>(`/api/wishlist/`);
}

export async function addToWishlist(productId: number) {
  return http<WishlistItem>(`/api/wishlist/`, {
    method: 'POST',
    body: { product: productId },
  });
}

export async function removeWishlistItem(id: number) {
  return http<void>(`/api/wishlist/${id}/`, { method: 'DELETE' });
}
