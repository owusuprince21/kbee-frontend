'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { listProducts } from '@/lib/api/products';
import type { Product } from '@/lib/types';

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

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function productImage(product: Product): string | undefined {
  const p = product as Product & {
    main_image?: string | null;
    main_image_url?: string | null;
  };
  return normalizeUrl(p.main_image_url) || normalizeUrl(p.main_image) || normalizeUrl(p.images?.[0]?.image);
}

function mapProductsToPromos(products: Product[]) {
  const seen = new Set<string>();
  const promos: BrandPromo[] = [];

  for (const product of products) {
    const slug = String((product as any)?.brand || '').trim().toLowerCase();
    if (!slug || slug === 'undefined' || slug === 'null' || seen.has(slug)) continue;

    const image = productImage(product);
    if (!image) continue;

    seen.add(slug);
    promos.push({
      name: `${(product as any)?.brand_display || titleCase(slug)} Laptops`,
      slug,
      image,
      categorySlug: 'laptops',
    });

    if (promos.length >= 2) break;
  }

  return promos;
}

function validPromo(p: BrandPromo) {
  const slug = String(p.slug || '').trim().toLowerCase();
  const categorySlug = String(p.categorySlug || 'laptops').trim().toLowerCase();
  return (
    Boolean(slug && slug !== 'undefined' && slug !== 'null') &&
    Boolean(categorySlug && categorySlug !== 'undefined' && categorySlug !== 'null')
  );
}

function promoHref(p: BrandPromo) {
  const categorySlug = validPromo(p) ? p.categorySlug || 'laptops' : 'laptops';
  return `/category/${categorySlug}/brand/${p.slug}`;
}

function fallbackPromo(): BrandPromo {
  return {
    name: 'Dell Laptops',
    slug: 'dell',
    image: '/dell.png',
    bg: '#dff0f6',
    tagline: 'Up to 30% Off',
    categorySlug: 'laptops',
  } as BrandPromo;
}

export default function PromoFlex({
  promos: promosProp,
}: { promos?: BrandPromo[] }) {
  const [fetched, setFetched] = useState<BrandPromo[] | null>(null);

  useEffect(() => {
    if (promosProp?.length) return; 
    let cancelled = false;

    (async () => {
      try {
        const data = await listProducts({
          category: 'laptops',
          page_size: 24,
          ordering: '-updated_at',
        });
        const rows = Array.isArray((data as any)?.results) ? (data as any).results : [];
        if (!cancelled) setFetched(mapProductsToPromos(rows));
      } catch {
        if (!cancelled) setFetched([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [promosProp]);

  const promos: BrandPromo[] = useMemo(() => {
    if (promosProp?.length) return promosProp.filter(validPromo).slice(0, 2);
    if (fetched?.length) return fetched.filter(validPromo).slice(0, 2);

    // Fallback to two static promos if API has nothing yet
    return [
      fallbackPromo(),
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

                  <a href={promoHref(p)}>
                    <Button className="mt-4 w-max rounded-full bg-amber-600 px-5 font-bold text-white shadow-sm transition hover:bg-amber-700 hover:shadow-md">
                      Shop Now
                    </Button>
                  </a>

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
                    sizes="(max-width: 768px) 45vw, 25vw"
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
