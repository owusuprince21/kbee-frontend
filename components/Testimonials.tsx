'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';

export type Testimonial = {
  id?: number | string;
  comment: string;
  rating: number;
  name?: string | null;
  full_name?: string | null;
  customer_name?: string | null;
  photoURL?: string | null;
  photo_url?: string | null;
  customer?:
    | { full_name?: string | null; photo_url?: string | null }
    | number
    | null;
  role?: string | null;

  product?:
    | { id?: number | string; slug?: string; url?: string }
    | number
    | string
    | null;
  productSlug?: string;
  product_slug?: string;
  productName?: string;
  product_name?: string;
  productImage?: string | null;
  product_image?: string | null;
  productId?: number | string;
  product_id?: number | string;
  productUrl?: string;
  product_url?: string;
};

function pickNameAndPhoto(t: Testimonial) {
  const cust = typeof t.customer === 'object' && t.customer ? t.customer : undefined;
  const name =
    cust?.full_name ??
    t.customer_name ??
    t.full_name ??
    t.name ??
    'Customer';
  const photo =
    cust?.photo_url ??
    t.photo_url ??
    t.photoURL ??
    null;
  return { name: String(name), photo: photo || null };
}

function getProductHref(t: Testimonial): string | undefined {
  const explicitUrl =
    (t as any).productUrl ??
    (t as any).product_url ??
    (typeof t.product === 'object' && t.product ? (t.product as any).url : undefined);
  if (explicitUrl) return String(explicitUrl);

  const p: any = t.product;
  const slug =
    (t as any).productSlug ??
    (t as any).product_slug ??
    (typeof p === 'object' && p ? p.slug : undefined) ??
    (typeof p === 'string' ? p : undefined);

  const id =
    (t as any).productId ??
    (t as any).product_id ??
    (typeof p === 'object' && p ? p.id : undefined) ??
    (typeof p === 'number' ? p : undefined);

  const base = slug
    ? `/product/${slug}`
    : typeof id !== 'undefined'
      ? `/product/${id}`
      : undefined;

  return base ? `${base}#reviews` : undefined;
}

function getProductName(t: Testimonial): string | undefined {
  const p: any = t.product;
  const name =
    (t as any).productName ??
    (t as any).product_name ??
    (typeof p === 'object' && p ? p.name : undefined);

  return name ? String(name) : undefined;
}

function firstSentence(comment: string) {
  const text = String(comment || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = match?.[1]?.trim() || text;

  return sentence.length < text.length ? `${sentence}...` : sentence;
}

function Initials({ name }: { name: string }) {
  const letters = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
      {letters}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value * 2) / 2));
  return (
    <div className="flex items-center gap-1" aria-label={`${v} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return (
          <span key={i} className="relative inline-block h-4 w-4 text-gray-300">
            ★
            <span className="absolute inset-0 overflow-hidden text-yellow-500" style={{ width: `${fill * 100}%` }}>
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function Testimonials({ items }: { items: Testimonial[] }) {
  const trackItems = useMemo(() => {
    const seen = new Set<string>();
    return (items || []).filter((item) => {
      const key = item.id ? `id:${item.id}` : `${item.full_name || item.name || item.customer_name || ''}:${item.comment}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items]);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<number | null>(null);

  const SPEED = 0.40; // px per frame

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const tick = () => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return;

    if (!pausedRef.current) {
      const maxScroll = Math.max(0, track.scrollWidth - vp.clientWidth);
      if (maxScroll <= 1) return;
      vp.scrollLeft += SPEED;
      if (vp.scrollLeft >= maxScroll) vp.scrollLeft = 0;
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const pause = () => { pausedRef.current = true; };
  const resume = () => {
    pausedRef.current = false;
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  };
  const pauseFor = (ms = 1200) => {
    pause();
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(resume, ms) as unknown as number;
  };

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || !trackItems.length) return;

    const onEnter = () => pause();
    const onLeave = () => resume();
    const onTouchStart = () => pause();
    const onTouchEnd = () => pauseFor(1200);
    const onWheel = () => pauseFor(1200);

    vp.addEventListener('mouseenter', onEnter);
    vp.addEventListener('mouseleave', onLeave);
    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchend', onTouchEnd, { passive: true });
    vp.addEventListener('wheel', onWheel, { passive: true });

    pausedRef.current = false;
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);

    return () => {
      stop();
      vp.removeEventListener('mouseenter', onEnter);
      vp.removeEventListener('mouseleave', onLeave);
      vp.removeEventListener('touchstart', onTouchStart as any);
      vp.removeEventListener('touchend', onTouchEnd as any);
      vp.removeEventListener('wheel', onWheel as any);
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, [trackItems.length]);

  if (!items?.length) return null;

  // ✅ Fixed equal height for all cards (200px) + overflow hidden.
  const cardClass =
    'group flex h-[200px] w-[260px] shrink-0 flex-col justify-start overflow-hidden rounded-lg bg-white p-4 shadow-md ring-1 ring-black/5 transition hover:shadow-lg sm:h-[200px] sm:w-[300px] sm:rounded-xl sm:p-5';

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold">Customer Feedback</h2>

        <div
          ref={viewportRef}
          className="no-scrollbar -mx-4 overflow-x-auto px-4"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <div ref={trackRef} className="flex gap-4 py-2 sm:gap-6">
            {trackItems.map((t, idx) => {
              const { name, photo } = pickNameAndPhoto(t);
              const href = getProductHref(t);
              const productName = getProductName(t);
              const shortComment = firstSentence(t.comment);

              const CardInner = (
                <article className={cardClass}>
                  <div className="mb-2 flex items-center gap-3">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={name}
                        className="h-10 w-10 rounded-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <Initials name={name} />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      {t.role ? (
                        <p className="truncate text-xs text-gray-500">{t.role}</p>
                      ) : null}
                    </div>
                  </div>

                  <Stars value={t.rating} />

                  {productName ? (
                    <p className="mt-2 truncate rounded-md bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-800">
                      Review from {productName}
                    </p>
                  ) : null}

                  {/* Reserve flexible space for the comment so the CTA stays aligned */}
                  <div className="mt-2 flex-1">
                    <p
                      className="break-words text-sm leading-snug italic text-gray-700 line-clamp-2"
                      title={t.comment}
                    >
                      “{shortComment}”
                    </p>
                  </div>

                  {href ? (
                    <span className="mt-2 inline-block text-xs font-medium text-yellow-700 opacity-100 transition group-hover:text-yellow-800 sm:opacity-0 sm:group-hover:opacity-100">
                      View product &amp; reviews →
                    </span>
                  ) : null}
                </article>
              );

              const key = t.id ? `review-${t.id}` : `review-${idx}-${t.comment}`;

              return href ? (
                <Link
                  key={key}
                  href={href}
                  className="block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  aria-label={`Read ${name}'s full review${productName ? ` for ${productName}` : ''} on product page`}
                  title="Go to product details"
                >
                  {CardInner}
                </Link>
              ) : (
                <div key={key}>{CardInner}</div>
              );
            })}
          </div>
        </div>

        <style jsx>{`
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  );
}
