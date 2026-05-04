'use client';

import { http, type Paginated } from './http';
import type { Review } from './types';
import { useAuthStore } from '@/store/authStore';

/** Build the Firebase identity headers your DRF uses (from the auth store). */
function firebaseHeaders(): HeadersInit {
  const s: any = useAuthStore.getState();
  const u: any = s.user || s.firebaseUser || {};

  const uid =
    u?.uid ?? u?.id ?? u?.firebase_uid ?? null;
  const email =
    u?.email ?? null;
  const name =
    u?.displayName ?? u?.full_name ?? u?.name ?? null;
  const photo =
    u?.photoURL ?? u?.photo_url ?? null;

  const h: Record<string, string> = {};
  if (uid) h['X-Firebase-UID'] = String(uid);
  if (email) h['X-User-Email'] = String(email);
  if (name) h['X-User-Name'] = String(name);
  if (photo) h['X-User-Photo'] = String(photo);
  return h;
}

/** GET /api/reviews/?product=<id>&page=&page_size= */
export async function listReviews(
  productId: number,
  params?: { page?: number; page_size?: number }
) {
  const q = new URLSearchParams();
  q.set('product', String(productId));
  if (params?.page) q.set('page', String(params.page));
  if (params?.page_size) q.set('page_size', String(params.page_size));

  return http<Paginated<Review>>(`/api/reviews/?${q.toString()}`);
}

/** POST /api/reviews/  (requires Firebase headers) */
export async function createReview(input: {
  product: number;
  rating: number;
  comment: string;
}) {
  return http<Review>(`/api/reviews/`, {
    method: 'POST',
    body: input,
    headers: firebaseHeaders(),
  });
}

/** DELETE /api/reviews/:id/  (requires Firebase headers; only author can delete) */
export async function deleteReview(id: number) {
  return http<void>(`/api/reviews/${id}/`, {
    method: 'DELETE',
    headers: firebaseHeaders(),
  });
}
