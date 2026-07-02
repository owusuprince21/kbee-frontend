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
  rating: number | string;
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

type ReviewEligibility = {
  can_review: boolean;
  has_review: boolean;
  review_id?: number | null;
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
  const firebaseUid = uid == null ? '' : String(uid);
  if (firebaseUid && !firebaseUid.startsWith('customer:')) h['X-Firebase-UID'] = firebaseUid;
  if (email) h['X-User-Email'] = String(email);
  if (name) h['X-User-Name'] = String(name);
  if (photo) h['X-User-Photo'] = String(photo);
  return { headers: h, uid };
}

function toUiReview(
  row: ApiReview,
  currentUid: string | number | null,
  currentReviewId?: number | null
): UiReview {
  const c = row.customer || ({} as ApiCustomer);
  const displayName = c.full_name ?? row.customer_name ?? 'Customer';
  const uid = c.firebase_uid ?? row.customer_id ?? c.id ?? null;
  const createdAt = Date.parse(row.created_at || '') || Date.now();
  const mine =
    row.id === currentReviewId ||
    (currentUid != null && String(uid ?? '') === String(currentUid));
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

function roundHalf(value: number) {
  return Math.round(value * 2) / 2;
}

const RatingStar = ({ fill, size = 'h-4 w-4' }: { fill: number; size?: string }) => (
  <span className={`relative inline-block ${size}`}>
    <Star className={`absolute inset-0 ${size} text-gray-300`} />
    <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
      <Star className={`fill-amber-500 text-amber-500 ${size}`} />
    </span>
  </span>
);

const Stars = ({ value, size = 'h-4 w-4' }: { value: number; size?: string }) => {
  const rounded = roundHalf(value);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rounded - (i - 1)));
        return <RatingStar key={i} fill={fill} size={size} />;
      })}
    </div>
  );
};

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
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [showAll, setShowAll] = useState(false);
  const mountedRef = useRef(true);
  const loadKeyRef = useRef('');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function fetchReviews(currentEligibility = eligibility) {
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
        .map((r) => toUiReview(r, currentUid, currentEligibility?.review_id ?? null))
        .sort((a, b) => b.createdAt - a.createdAt);
      if (mountedRef.current) setReviews(mapped);
    } catch {
      if (mountedRef.current) toast.error('Failed to load reviews.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function fetchEligibility() {
    if (!numericProductId || Number.isNaN(numericProductId)) return null;
    try {
      const data = await http<ReviewEligibility>(
        `/api/reviews/eligibility/?product=${numericProductId}`
      );
      if (mountedRef.current) setEligibility(data);
      return data;
    } catch {
      const fallback = { can_review: false, has_review: false, review_id: null };
      if (mountedRef.current) {
        setEligibility(fallback);
      }
      return fallback;
    }
  }

  // initial + user change
  useEffect(() => {
    let cancelled = false;
    const loadKey = `${numericProductId}:${identityKey}`;
    if (loadKeyRef.current === loadKey) return;
    loadKeyRef.current = loadKey;

    (async () => {
      const currentEligibility = await fetchEligibility();
      if (!cancelled) await fetchReviews(currentEligibility);
    })();
    return () => {
      cancelled = true;
    };
    
  }, [numericProductId, identityKey]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return 0;
    const s = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return Math.round(s * 10) / 10;
  }, [reviews]);

  const submit = async () => {
    if (!eligibility?.can_review) return toast.info('Only customers who purchased this product can review it.');
    if (!numericProductId || Number.isNaN(numericProductId)) return toast.error('Invalid product.');
    if (rating === 0 || !comment.trim()) return toast.error('Please select a rating and write a comment.');
    const normalizedRating = roundHalf(rating);

    const { headers, uid } = buildFirebaseHeaders(user);

    try {
      setPosting(true);
      const tempId = -Date.now(); 
      const optimistic: UiReview = {
        id: tempId,
        uid: uid ?? null,
        name: extractUserIdentity(user).name || 'You',
        photoURL: extractUserIdentity(user).photo || undefined,
        rating: normalizedRating,
        comment: comment.trim(),
        createdAt: Date.now(),
        mine: true,
      };
      setReviews((prev) => [optimistic, ...prev]);

 
      const created = await http<ApiReview>(`/api/reviews/`, {
        method: 'POST',
        headers,
        body: { product: numericProductId, rating: normalizedRating, comment: comment.trim() },
      });

      await fetchReviews();
      await fetchEligibility();

      setRating(0);
      setHover(0);
      setComment('');
      toast.success('Thanks for your review!');
    } catch (err: any) {
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
    const { headers } = buildFirebaseHeaders(user);

    try {
      setDeletingId(id);
      await http<void>(`/api/reviews/${id}/`, { method: 'DELETE', headers });
      await fetchReviews(); 
      await fetchEligibility();
      toast.success('Review deleted successfully!');
    } catch (err: any) {
      if (err instanceof ApiError) {
        toast.error(err.data?.detail || `Delete failed (HTTP ${err.status}).`);
      } else {
        toast.error('Could not delete review');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const StarBtn = ({ i }: { i: number }) => {
    const activeValue = hover || rating;
    return (
      <span className="relative inline-grid h-7 w-7 place-items-center">
        <button
          type="button"
          onMouseEnter={() => setHover(i - 0.5)}
          onMouseLeave={() => setHover(0)}
          onClick={() => setRating(i - 0.5)}
          disabled={!eligibility?.can_review}
          aria-label={`Rate ${i - 0.5} stars`}
          className="absolute left-0 top-0 z-10 h-full w-1/2 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => setRating(i)}
          disabled={!eligibility?.can_review}
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
          className="absolute right-0 top-0 z-10 h-full w-1/2 disabled:cursor-not-allowed"
        />
        <span className={!eligibility?.can_review ? 'opacity-50' : ''}>
          <RatingStar
            fill={activeValue >= i ? 1 : activeValue >= i - 0.5 ? 0.5 : 0}
            size="h-6 w-6"
          />
        </span>
      </span>
    );
  };

  const initials = (name?: string) =>
    (name || 'U').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  const visibleReviews = showAll ? reviews : reviews.slice(0, 5);
  const canReview = Boolean(eligibility?.can_review);

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
      <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-950">
            {eligibility?.has_review ? 'Update your review' : 'Write a review'}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {canReview
              ? 'Share your experience with this product.'
              : 'Only customers who have purchased this product can leave a review.'}
          </p>
        </div>
        <div className="mb-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => <StarBtn key={i} i={i} />)}
          <span className="ml-2 text-sm text-gray-500">{(hover || rating || 0).toFixed(1)}/5</span>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          disabled={!canReview}
          className="w-full rounded-lg border bg-white p-3 text-sm outline-none ring-0 focus:border-gray-300"
        />

        <div className="mt-3">
          <Button onClick={submit} disabled={!canReview || posting} className="rounded-full">
            {posting ? 'Posting...' : eligibility?.has_review ? 'Update Review' : 'Add Review'}
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
          visibleReviews.map((r) => (
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
        {reviews.length > 5 && (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'Show fewer reviews' : `View all ${reviews.length} reviews`}
          </Button>
        )}
      </div>
    </div>
  );
}
