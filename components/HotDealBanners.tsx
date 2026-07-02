'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/api/categories';

type BannerCategory = Pick<Category, 'name' | 'slug' | 'image'>;

const fallbackImages: Record<string, string> = {
  laptops: '/dell.png',
  'laptop-chargers': '/chargers.png',
  'wifi-routers': '/router.png',
  'external-drives': '/external-drive.png',
};

const palette = [
  {
    bg: '#DBF0EF',
    accent: 'text-teal-600',
    button: 'bg-teal-600 hover:bg-teal-700',
    headline: 'Shop Available Deals',
    copy: 'Explore quality items selected for this category.',
    cta: 'Shop Now',
  },
  {
    bg: '#FDE9DF',
    accent: 'text-orange-600',
    button: 'bg-orange-500 hover:bg-orange-600',
    headline: 'Fresh Picks In Stock',
    copy: 'Find reliable options with competitive pricing.',
    cta: 'Buy Now',
  },
];

function labelFromCategory(category: BannerCategory) {
  return String(category.name || category.slug)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function categoryImage(category: BannerCategory) {
  return category.image || fallbackImages[category.slug] || '/placeholder.jpg';
}

function HotDealBannersSkeleton() {
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-slate-100 p-3 sm:p-4 md:p-6">
            <div className="grid h-[220px] items-center gap-3 sm:h-[240px] md:h-[260px] md:grid-cols-2 md:gap-4">
              <div className="h-full animate-pulse rounded-xl bg-white/70" />
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded bg-white/80" />
                <div className="h-8 w-44 animate-pulse rounded bg-white/80" />
                <div className="h-5 w-56 animate-pulse rounded bg-white/80" />
                <div className="h-9 w-28 animate-pulse rounded-full bg-white/80" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HotDealBanners({ categories = [] }: { categories?: BannerCategory[] }) {
  const [mounted, setMounted] = useState(false);
  const banners = mounted ? categories.filter((category) => category.slug).slice(0, 2) : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <HotDealBannersSkeleton />;
  if (!banners.length) return null;

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {banners.map((category, index) => {
          const style = palette[index % palette.length];
          const label = labelFromCategory(category);
          const image = categoryImage(category);
          const imageFirst = index % 2 === 0;

          return (
            <div
              key={category.slug}
              className="rounded-2xl p-3 sm:p-4 md:p-6"
              style={{ background: style.bg }}
            >
              <div className="grid h-[220px] items-center gap-3 sm:h-[240px] md:h-[260px] md:grid-cols-2 md:gap-4">
                <div className={`relative h-full ${imageFirst ? 'order-1' : 'order-1 md:order-2'}`}>
                  <Image
                    src={image}
                    alt={label}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-contain"
                    priority={index === 0}
                  />
                </div>

                <div className={`${imageFirst ? 'order-2' : 'order-2 md:order-1'} text-center leading-tight md:text-left`}>
                  <p className="text-sm text-slate-700/80 sm:text-base">{label}</p>
                  <h3 className="mt-0.5 line-clamp-2 text-2xl font-extrabold text-[#162a45] sm:text-3xl md:text-4xl">
                    {style.headline}
                  </h3>
                  <p className={`mt-1 text-base font-semibold sm:text-lg ${style.accent}`}>
                    {style.copy}
                  </p>

                  <Link href={`/category/${category.slug}`} className="inline-block">
                    <Button className={`mt-3 h-9 rounded-full px-4 text-sm text-white ${style.button}`}>
                      {style.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
