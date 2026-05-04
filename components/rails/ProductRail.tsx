// components/rails/ProductRail.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';
import { getRecentlyViewed, subscribeRecentlyViewed } from '@/lib/recentlyViewed';

type Base = { className?: string; limit?: number };

// EITHER: render a provided list
type FromListProps = Base & {
  title: string;
  products: Product[];
  source?: undefined;
};

// OR: render recently viewed (localStorage)
type RecentProps = Base & {
  source: 'recent';
  title?: string;
  products?: never;
};

type Props = FromListProps | RecentProps;

export default function ProductRail(props: Props) {
  const rail = useRef<HTMLDivElement>(null);

  const isRecent = 'source' in props && props.source === 'recent';
  const [items, setItems] = useState<Product[]>(isRecent ? [] : props.products);

  // keep items in sync if a provided list changes
  useEffect(() => {
    if (!isRecent) setItems(props.products);
  }, [isRecent, 'products' in props ? props.products : null]);

  // load + live-update recently viewed
  useEffect(() => {
    if (!isRecent) return;
    const initial = getRecentlyViewed();
    setItems(props.limit ? initial.slice(0, props.limit) : initial);
    const unsub = subscribeRecentlyViewed((next) => {
      setItems(props.limit ? next.slice(0, props.limit) : next);
    });
    return () => unsub();
  }, [isRecent, props.limit]);

  const scrollBy = (dir: 'prev' | 'next') => {
    const el = rail.current;
    if (!el) return;
    const amount = Math.min(520, el.clientWidth * 0.9);
    el.scrollBy({ left: dir === 'next' ? amount : -amount, behavior: 'smooth' });
  };

  const title =
    'title' in props && props.title ? props.title : 'Recently Viewed Products';

  if (!items?.length) return null;

  return (
    <section className={props.className}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold">{title}</h2>
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="icon" onClick={() => scrollBy('prev')} aria-label="Previous">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scrollBy('next')} aria-label="Next">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div
        ref={rail}
        className="no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {items.map((p) => (
          <div
            key={p.id ?? (p as any).slug}
            className="
              snap-start
              /* 2 per view on mobile */
              w-[49%] min-w-[49%]
              /* 5 per view on desktop; ~19% leaves room for gaps */
              lg:w-[19%] lg:min-w-[19%]
            "
          >
            <div className="h-full">
              <ProductCard product={p} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
