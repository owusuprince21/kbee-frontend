'use client';

import ProductCard from './ProductCard';
import type { Product } from '@/lib/types';

export default function ProductGrid({ products }: { products: Product[] }) {
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
