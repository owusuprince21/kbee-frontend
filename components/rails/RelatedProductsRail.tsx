// components/rails/RelatedProductsRail.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';
import { listProducts, type ProductQuery } from '@/lib/api/products';

type BaseProps = { base: Product; title?: string; limit?: number };
type ListProps = { products: Product[]; title?: string; limit?: number };
type Props = BaseProps | ListProps;

function hasBase(p: Props): p is BaseProps {
  return (p as BaseProps).base !== undefined;
}
function hasProducts(p: Props): p is ListProps {
  return (p as ListProps).products !== undefined;
}

function isLaptopCategory(p?: Product) {
  const slug = (p as any)?.category?.slug || (p as any)?.category || '';
  const name = (p as any)?.category?.name || '';
  const s = String(slug || name).toLowerCase();
  return /laptop|notebook/.test(s);
}
function brandParamFromProduct(p: Product): string | number | undefined {
  const b: any = (p as any).brand;
  if (!b) return undefined;
  return typeof b === 'object' ? b.slug ?? b.id ?? b.name ?? undefined : b;
}
function categoryParamFromProduct(p: Product): string | number | undefined {
  const c: any = (p as any).category;
  if (!c) return undefined;
  return typeof c === 'object' ? c.slug ?? c.id ?? c.name ?? undefined : c;
}

export default function RelatedProductsRail(props: Props) {
  const { title, limit = 8 } = props;
  const base = hasBase(props) ? props.base : undefined;
  const [items, setItems] = useState<Product[]>(hasProducts(props) ? props.products : []);

  const dynamicTitle = useMemo(() => {
    if (title) return title;
    if (base && isLaptopCategory(base)) {
      const b: any = (base as any).brand;
      const brandName = typeof b === 'object' ? (b?.name || b?.slug) : b;
      return brandName ? `More from ${brandName}` : 'Related Laptops';
    }
    if (base) {
      const c: any = (base as any).category;
      const catName = typeof c === 'object' ? (c?.name || c?.slug) : c;
      return catName ? `More in ${catName}` : 'Related Products';
    }
    return 'Related Products';
  }, [base, title]);

  useEffect(() => {
    if (!base) return;
    let cancelled = false;

    (async () => {
      const params: ProductQuery = { page_size: limit, ordering: '-updated_at' };
      if (isLaptopCategory(base)) {
        const brandParam = brandParamFromProduct(base);
        if (brandParam !== undefined) params.brand = brandParam;
        else params.category = categoryParamFromProduct(base);
      } else {
        params.category = categoryParamFromProduct(base);
      }

      try {
        const res = await listProducts(params);
        const rows = Array.isArray((res as any)?.results)
          ? (res as any).results
          : Array.isArray(res)
          ? (res as any)
          : [];
        const filtered = rows.filter((x: any) => x?.id !== (base as any).id);
        if (!cancelled) setItems(filtered.slice(0, limit));
      } catch {
        if (!cancelled) setItems([]);
      }
    })();

    return () => { cancelled = true; };
  }, [base?.id, limit]);

  if (!items.length) return null;

  return (
    <section className="mb-16">
      <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{dynamicTitle}</h2>

      {/* 2 columns on mobile, 5 on desktop */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
        {items.map((p) => (
          <div key={p.id} className="h-full">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
