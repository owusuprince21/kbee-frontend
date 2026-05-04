'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';
import { getRecentlyViewed, subscribeRecentlyViewed } from '@/lib/recentlyViewed';

export default function RecentlyViewedRail({
  products,
  title = 'Recently Viewed Products',
}: {
  /** Optional fallback list (used only if local history is empty) */
  products?: Product[];
  title?: string;
}) {
  const [items, setItems] = useState<Product[]>(
    Array.isArray(products) ? products : []
  );

  useEffect(() => {
    const local = getRecentlyViewed();
    if (local.length) setItems(local);
    const unsub = subscribeRecentlyViewed((next) => {
      setItems(next.length ? next : (Array.isArray(products) ? products : []));
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!items.length) return null;

  return (
    <section className="mb-16">
      <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{title}</h2>

      {/* 2 cols on mobile, 3 on md, 5 on lg */}
      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-3
          lg:grid-cols-5
          gap-4 sm:gap-6
        "
      >
        {items.map((p) => (
          <div key={p.id} className="h-full">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
