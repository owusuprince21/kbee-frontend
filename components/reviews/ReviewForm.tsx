'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { http, ApiError, type Paginated } from '@/lib/api/http';
import { useAuthStore } from '@/store/authStore';

/* ===== API shapes matching your ReviewSerializer ===== */
type ApiCustomer = {
  id?: number | string;
  full_name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  firebase_uid?: string | null;
};

type ApiReview = {
  id: number;
  product: number;
  rating: number;
  comment: string;
  created_at: string; // ISO
  customer?: ApiCustomer | null;   // nested customer present on GET
  customer_id?: number | string;   // read-only convenience from serializer
  customer_name?: string | null;   // fallback string from serializer
};

type UiReview = {
  id: number;
  uid?: string | number | null;
  name: string;
  photoURL?: string | null;
  rating: number;
  comment: string;
  createdAt: number;
  mine?: boolean;
};

/* ===== helpers ===== */
function extractUserIdentity(u: unknown) {
  const anyU = (u || {}) as Record<string, any>;
  const uid = anyU.uid ?? anyU.id ?? anyU.firebase_uid ?? null;
  const email = anyU.email ?? null;
  const name = anyU.displayName ?? anyU.full_name ?? anyU.name ?? null;
  const photo = anyU.photoURL ?? anyU.photo_url ?? null;
  return { uid, email, name, photo };
}

function buildFirebaseHeaders(user: unknown): { headers: HeadersInit; uid: string | number | null } {
  const { uid, email, name, photo } = extractUserIdentity(user);
  const h: Record<string, string> = {};
  if (uid != null) h['X-Firebase-UID'] = String(uid);
  if (email) h['X-User-Email'] = String(email);
  if (name) h['X-User-Name'] = String(name);
  if (photo) h['X-User-Photo'] = String(photo);
  return { headers: h, uid };
}

function toUiReview(row: ApiReview, currentUid: string | number | null): UiReview {
  const c = row.customer || ({} as ApiCustomer);
  const displayName = c.full_name ?? row.customer_name ?? 'Customer';
  const uid = c.firebase_uid ?? row.customer_id ?? c.id ?? null;
  const createdAt = Date.parse(row.created_at || '') || Date.now();
  const mine = currentUid != null && String(uid ?? '') === String(currentUid);
  return {
    id: row.id,
    uid,
    name: String(displayName),
    photoURL: c.photo_url ?? undefined,
    rating: Number(row.rating) || 0,
    comment: row.comment || '',
    createdAt,
    mine,
  };
}

const Stars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

export default function ReviewForm({ productId }: { productId: string | number }) {
  const { user } = useAuthStore();

  const numericProductId = useMemo(() => Number(productId), [productId]);
  const identityKey = useMemo(() => {
    const { uid } = extractUserIdentity(user);
    return uid == null ? '' : String(uid);
  }, [user]);

  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<UiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function fetchReviews() {
    if (!numericProductId || Number.isNaN(numericProductId)) return;
    setLoading(true);
    try {
      const data = await http<ApiReview[] | Paginated<ApiReview>>(
        `/api/reviews/?product=${numericProductId}&page_size=100&ordering=-created_at`
      );
      const rows = Array.isArray((data as Paginated<ApiReview>)?.results)
        ? (data as Paginated<ApiReview>).results
        : (data as ApiReview[]);
      const currentUid = identityKey || null;
      const mapped = (rows || [])
        .map((r) => toUiReview(r, currentUid))
        .sort((a, b) => b.createdAt - a.createdAt);
      if (mountedRef.current) setReviews(mapped);
    } catch {
      if (mountedRef.current) toast.error('Failed to load reviews.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // initial + user change
  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericProductId, identityKey]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return 0;
    const s = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return Math.round(s * 10) / 10;
  }, [reviews]);

  const submit = async () => {
    if (!user) return toast.info('Please sign in to post a review.');
    if (!numericProductId || Number.isNaN(numericProductId)) return toast.error('Invalid product.');
    if (rating === 0 || !comment.trim()) return toast.error('Please select a rating and write a comment.');

    const { headers, uid } = buildFirebaseHeaders(user);
    if (!(headers as Record<string, string>)['X-Firebase-UID']) {
      return toast.error('Missing user UID. Please sign in again.');
    }

    try {
      setPosting(true);
      // Optimistic add (instant UI)
      const tempId = -Date.now(); // temporary negative id
      const optimistic: UiReview = {
        id: tempId,
        uid: uid ?? null,
        name: extractUserIdentity(user).name || 'You',
        photoURL: extractUserIdentity(user).photo || undefined,
        rating,
        comment: comment.trim(),
        createdAt: Date.now(),
        mine: true,
      };
      setReviews((prev) => [optimistic, ...prev]);

      // POST to API
      const created = await http<ApiReview>(`/api/reviews/`, {
        method: 'POST',
        headers,
        body: { product: numericProductId, rating, comment: comment.trim() },
      });

      // Replace optimistic with real one by reloading from server
      await fetchReviews();

      setRating(0);
      setHover(0);
      setComment('');
      toast.success('Thanks for your review!');
    } catch (err: any) {
      // rollback optimistic on error
      setReviews((prev) => prev.filter((r) => r.id >= 0));
      if (err instanceof ApiError) {
        const detail =
          (typeof err.data === 'string' && err.data) ||
          err.data?.detail ||
          err.data?.non_field_errors?.[0] ||
          (Array.isArray(err.data?.comment) && err.data.comment[0]) ||
          (Array.isArray(err.data?.rating) && err.data.rating[0]) ||
          '';
        toast.error(detail ? String(detail) : `Review failed (HTTP ${err.status}).`);
      } else {
        toast.error('Could not submit review.');
      }
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: number) => {
    if (!user) return;
    const { headers } = buildFirebaseHeaders(user);
    if (!(headers as Record<string, string>)['X-Firebase-UID']) {
      return toast.error('Missing user UID. Please sign in again.');
    }

    try {
      setDeletingId(id);
      await http<void>(`/api/reviews/${id}/`, { method: 'DELETE', headers });
      await fetchReviews(); // refresh from server to reflect truth
      toast.success('Review deleted.');
    } catch (err: any) {
      if (err instanceof ApiError) {
        toast.error(err.data?.detail || `Delete failed (HTTP ${err.status}).`);
      } else {
        toast.error('Could not delete review.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const StarBtn = ({ i }: { i: number }) => (
    <button
      type="button"
      onMouseEnter={() => setHover(i)}
      onMouseLeave={() => setHover(0)}
      onClick={() => setRating(i)}
      aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
    >
      <Star className={`h-6 w-6 ${(hover || rating) >= i ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    </button>
  );

  const initials = (name?: string) =>
    (name || 'U').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Aggregate header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <Stars value={Math.round(avg)} />
          <span className="text-sm text-gray-600">
            {avg.toFixed(1)} / 5 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border bg-white p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => <StarBtn key={i} i={i} />)}
          <span className="ml-2 text-sm text-gray-500">{rating || 0}/5</span>
        </div>

        {!user && (
          <p className="mb-2 text-sm text-gray-600">
            You must be signed in to add a rating and comment.
          </p>
        )}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="w-full rounded-lg border bg-white p-3 text-sm outline-none ring-0 focus:border-gray-300"
        />

        <div className="mt-3">
          <Button onClick={submit} disabled={!user || posting} className="rounded-full">
            {posting ? 'Posting…' : user ? 'Add Review' : 'Sign in to review'}
          </Button>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-600">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-600">No reviews yet. Be the first!</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-4 rounded-xl border bg-white p-4">
              <div className="flex items-start gap-3">
                {r.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoURL} alt={r.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                    {initials(r.name)}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.name}</span>
                    <Stars value={r.rating} />
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{r.comment}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {r.mine && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(r.id)}
                  disabled={deletingId === r.id}
                  className="text-red-600 hover:text-red-700"
                  aria-label="Delete your review"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
