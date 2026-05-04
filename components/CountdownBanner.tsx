'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/api/http';

/* ======= API types ======= */
type ApiCountdown = {
  kicker?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  cta_text?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  image_url?: string | null;
  product?: {
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    main_image_url?: string | null;
    images?: { image?: string | null }[];
  } | null;
  // any one of these may hold the end time
  end_at?: string | null;
  ends_at?: string | null;
  deadline?: string | null;
  end?: string | null;
};

type Paginated<T> = { results?: T[] };

type DealView = {
  kicker: string;
  headline: string;
  subheadline?: string;
  href: string;
  ctaText: string;
  imageSrc: string;
  endAt: Date | null;
};

/* ======= utils ======= */

function ensureUrl(u?: string | null) {
  if (!u) return undefined;
  let s = String(u).trim();
  if (!s) return undefined;
  if (s.startsWith('//')) s = 'https:' + s;
  if (s.startsWith('http://')) s = s.replace(/^http:\/\//, 'https://');
  if (s.startsWith('https://') || s.startsWith('/')) return s;
  return undefined;
}

function pickImage(row?: ApiCountdown): string {
  return (
    ensureUrl(row?.image_url) ||
    ensureUrl(row?.product?.main_image_url) ||
    ensureUrl(row?.product?.images?.[0]?.image) ||
    '/placeholder.png'
  )!;
}

// Accepts: ISO with Z or offset, "YYYY-MM-DD HH:mm:ss", or ISO without zone.
// If no timezone info, assume UTC so it’s consistent.
function parseDateLoose(v?: string | number | null): Date | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : undefined;
  }
  let s = String(v).trim();
  if (!s) return undefined;

  const hasTZ = /Z$|[+-]\d{2}:\d{2}$/.test(s);
  if (!hasTZ) {
    // "YYYY-MM-DD HH:mm:ss"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) {
      s = s.replace(' ', 'T') + 'Z';
    }
    // "YYYY-MM-DDTHH:mm(:ss)" (no Z/offset)
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
      s = s + 'Z';
    }
  }

  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

function parseEnd(row?: ApiCountdown): Date | null {
  return (
    parseDateLoose(row?.ends_at) ||
    parseDateLoose(row?.end_at) ||
    parseDateLoose(row?.deadline) ||
    parseDateLoose(row?.end) ||
    null
  );
}

function buildHref(row: ApiCountdown | undefined, fallback = '/shop') {
  const slug = row?.product?.slug?.trim();
  const raw = slug ? `/product/${slug}` : (row?.cta_href?.trim() || '');
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw;
  return `/product/${raw}`;
}

function partsUntil(ms: number) {
  const totalSec = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, finished: totalSec <= 0 };
}

/* ======= component ======= */

const POLL_MS = 30_000; // refresh from backend to reflect DB changes

export default function CountdownBanner() {
  const [deal, setDeal] = useState<DealView | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const mounted = useRef(true);

  // fetch active / fallback to first
  async function fetchDeal() {
    try {
      const bust = `?_=${Date.now()}`;

      let row: ApiCountdown | undefined;
      const active = await http<ApiCountdown[] | ApiCountdown>(`/api/countdown/active/${bust}`).catch(() => null);
      if (Array.isArray(active) && active.length) row = active[0];

      if (!row) {
        const list = await http<ApiCountdown[] | Paginated<ApiCountdown>>(`/api/countdown/${bust}`).catch(() => null);
        if (Array.isArray(list)) row = list[0];
        else if (list && typeof list === 'object' && 'results' in list) {
          row = (list as Paginated<ApiCountdown>).results?.[0];
        }
      }

      if (!mounted.current) return;

      if (!row) {
        setDeal(null);
        return;
      }

      setDeal({
        kicker: row.kicker || 'Limited-Time Deal',
        headline: row.headline || row.product?.name || 'Great Offer',
        subheadline:
          row.subheadline ||
          (row.product?.description ? String(row.product.description).slice(0, 80) + '…' : undefined),
        href: buildHref(row),
        ctaText: row.cta_text || row.cta_label || 'Shop Now',
        imageSrc: pickImage(row),
        endAt: parseEnd(row), // can be null, we’ll handle it below
      });
    } catch {
      if (!mounted.current) return;
      // keep previous state on failure
    }
  }

  // initial + polling
  useEffect(() => {
    mounted.current = true;
    fetchDeal();
    const pid = setInterval(fetchDeal, POLL_MS);
    return () => { mounted.current = false; clearInterval(pid); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1s ticker
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // compute parts (hooks always run, no conditional calls)
  const { days, hours, minutes, seconds, finished } = useMemo(() => {
    if (!deal?.endAt) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: false };
    return partsUntil(deal.endAt.getTime() - nowMs);
  }, [deal?.endAt, nowMs]);

  if (!deal) return null;

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#E5F2F8]">
          <div className="relative grid items-center gap-4 p-4 sm:p-6 md:grid-cols-2 md:gap-6">
            {/* IMAGE */}
            <div className="relative order-1 h-36 sm:h-44 md:order-2 md:h-60">
              <Image
                src={deal.imageSrc}
                alt={deal.headline}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* COPY */}
            <div className="order-2 md:order-1">
              {deal.kicker && <p className="text-base font-semibold text-indigo-600">{deal.kicker}</p>}
              <h2 className="mt-1.5 text-2xl font-extrabold leading-tight text-[#162a45] sm:text-3xl md:text-4xl">
                {deal.headline}
              </h2>
              {deal.subheadline && <p className="mt-2 text-base text-slate-700">{deal.subheadline}</p>}

              <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                <TimeBox value={days} label="Days" />
                <TimeBox value={hours} label="Hours" />
                <TimeBox value={minutes} label="Minutes" />
                <TimeBox value={seconds} label="Seconds" />
              </div>

              <Link href={finished ? '/shop' : deal.href} className="inline-block">
                <Button
                  disabled={finished}
                  className="mt-5 rounded-full bg-indigo-600 px-6 py-4 text-white hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {finished ? 'Offer Ended' : deal.ctaText}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="grid h-14 w-full place-items-center rounded-xl bg-white text-xl font-extrabold text-[#162a45] shadow-sm sm:h-16 sm:text-2xl md:w-20">
        {pad(value)}
      </div>
      <span className="text-[11px] text-slate-600 sm:text-xs">{label}</span>
    </div>
  );
}
