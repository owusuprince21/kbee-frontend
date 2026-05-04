'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';

export type Testimonial = {
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
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1" aria-label={`${v} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < v ? 'text-yellow-500' : 'text-gray-300'}>★</span>
      ))}
    </div>
  );
}

export default function Testimonials({ items }: { items: Testimonial[] }) {
  const trackItems = useMemo(() => (items?.length ? [...items, ...items] : []), [items]);

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
      const half = track.scrollWidth / 2;
      vp.scrollLeft += SPEED;
      if (vp.scrollLeft >= half) vp.scrollLeft -= half;
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

                  {/* Reserve flexible space for the comment so the CTA stays aligned */}
                  <div className="mt-2 flex-1">
                    <p
                      className="break-words text-sm leading-snug italic text-gray-700 line-clamp-3"
                      title={t.comment}
                    >
                      “{t.comment}”
                    </p>
                  </div>

                  {href ? (
                    <span className="mt-2 inline-block text-xs font-medium text-yellow-700 opacity-0 transition group-hover:opacity-100">
                      View product &amp; reviews →
                    </span>
                  ) : null}
                </article>
              );

              return href ? (
                <Link
                  key={idx}
                  href={href}
                  className="block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  aria-label={`Read ${name}'s full review on product page`}
                  title="Go to product details"
                >
                  {CardInner}
                </Link>
              ) : (
                <div key={idx}>{CardInner}</div>
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
