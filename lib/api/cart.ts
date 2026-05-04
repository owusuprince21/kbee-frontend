'use client';

import { http, Paginated } from './http';
import type { CartItem } from './types';

export async function listCart() {
  return http<Paginated<CartItem>>(`/api/cart-items/`);
}

export async function addToCart(productId: number, quantity = 1) {
  return http<CartItem>(`/api/cart-items/`, {
    method: 'POST',
    body: { product: productId, quantity },
  });
}

export async function updateCartItem(id: number, quantity: number) {
  return http<CartItem>(`/api/cart-items/${id}/`, {
    method: 'PATCH',
    body: { quantity },
  });
}

export async function removeCartItem(id: number) {
  return http<void>(`/api/cart-items/${id}/`, { method: 'DELETE' });
}
