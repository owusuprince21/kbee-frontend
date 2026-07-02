'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/lib/types';

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 md:gap-y-12 lg:grid-cols-5 lg:gap-y-12">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="h-[280px] animate-pulse rounded-2xl bg-slate-100 ring-1 ring-black/5 sm:h-[320px]"
        />
      ))}
    </div>
  );
}

export default function ProductGrid({ products }: { products: Product[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ProductGridSkeleton />;
  }

  if (!Array.isArray(products) || products.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">No products found.</p>;
  }

  return (
    <div
      className="
        grid
        grid-cols-2
        md:grid-cols-3
        lg:grid-cols-5

        /* make MOBILE the roomiest */
        gap-x-6 gap-y-14
        sm:gap-x-6 sm:gap-y-14
        md:gap-x-6 md:gap-y-12
        lg:gap-x-6 lg:gap-y-12

        auto-rows-fr
      "
    >
      {products.map((p: any) => (
        <ProductCard key={p.id ?? p.slug} product={p} />
      ))}
    </div>
  );
}
