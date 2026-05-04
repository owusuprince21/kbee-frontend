'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/api/http';

type BrandApi = {
  id: number;
  name: string;
  slug: string;
  logo_url?: string | null;
  image_url?: string | null;
  logo?: string | null;
  image?: string | null;
};

type BrandPromo = {
  name: string;
  slug: string;
  image: string;
  /** optional custom background color */
  bg?: string;
  /** optional bottom-left tagline (e.g. "Up to 30% Off") */
  tagline?: string;
  /** optional category slug; defaults to "laptops" */
  categorySlug?: string;
};

function normalizeUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  return u.startsWith('http://') ? u.replace(/^http:\/\//, 'https://') : u;
}

function mapBrandApi(b: BrandApi): BrandPromo | null {
  const image =
    normalizeUrl(b.logo_url) ||
    normalizeUrl(b.image_url) ||
    normalizeUrl(b.logo) ||
    normalizeUrl(b.image) ||
    undefined;
  if (!image) return null;
  return {
    name: b.name,
    slug: b.slug,
    image,
    categorySlug: 'laptops',
  };
}

export default function PromoFlex({
  promos: promosProp,
}: { promos?: BrandPromo[] }) {
  const [fetched, setFetched] = useState<BrandPromo[] | null>(null);

  useEffect(() => {
    if (promosProp?.length) return; // use provided promos
    let cancelled = false;

    (async () => {
      try {
        // try featured first, then general
        const featured = await http<BrandApi[] | { results: BrandApi[] }>(
          '/api/brands/?featured=true&page_size=2'
        ).catch(() => null);

        const src =
          (featured && ('results' in (featured as any) ? (featured as any).results : featured)) ||
          (await http<BrandApi[] | { results: BrandApi[] }>(
            '/api/brands/?page_size=2'
          ).then((d) => ('results' in (d as any) ? (d as any).results : d)));

        const mapped = (src || [])
          .map(mapBrandApi)
          .filter(Boolean) as BrandPromo[];

        if (!cancelled) setFetched(mapped.slice(0, 2));
      } catch {
        if (!cancelled) setFetched([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [promosProp]);

  const promos: BrandPromo[] = useMemo(() => {
    if (promosProp?.length) return promosProp.slice(0, 2);
    if (fetched?.length) return fetched.slice(0, 2);

    // Fallback to two static promos if API has nothing yet
    return [
      {
        name: 'Dell Laptops',
        slug: 'dell',
        image: '/dell.png',
        bg: '#dff0f6',
        tagline: 'Up to 30% Off',
        categorySlug: 'laptops',
      },
      {
        name: 'HP Laptops',
        slug: 'hp',
        image: '/hp.png',
        bg: '#ece8df',
        tagline: 'Special Deals',
        categorySlug: 'laptops',
      },
    ];
  }, [promosProp, fetched]);

  // Two soft backgrounds if none provided
  const fallbacks = ['#dff0f6', '#ece8df'];

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {promos.map((p, i) => (
            <div
              key={p.slug}
              className="relative overflow-hidden rounded-2xl p-6 sm:p-8 md:p-10"
              style={{ background: p.bg || fallbacks[i % fallbacks.length] }}
            >
              <div className="grid grid-cols-2 items-center gap-4">
                {/* Left: copy */}
                <div className="flex min-w-0 flex-col">
                  <h3 className="text-slate-900 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                    {p.name}
                  </h3>

                  <Link
                    href={`/category/${p.categorySlug ?? 'laptops'}/brand/${p.slug}`}
                  >
                    <Button className="mt-4 w-max bg-yellow-500 text-black hover:bg-yellow-600">
                      Shop Now
                    </Button>
                  </Link>

                  {p.tagline && (
                    <p className="mt-8 text-sm sm:text-base text-slate-700">
                      {p.tagline}
                    </p>
                  )}
                </div>

                {/* Right: product image */}
                <div className="relative h-28 sm:h-40 md:h-56">
                  <Image
                    src={p.image}
                    alt={`${p.name} promo`}
                    fill
                    className="object-contain translate-x-4 sm:translate-x-6 md:translate-x-8"
                    priority={false}
                  />
                </div>
              </div>
            </div>
          ))}
          {/* If only one promo came back, keep the grid balanced by showing one column */}
        </div>
      </div>
    </section>
  );
}
