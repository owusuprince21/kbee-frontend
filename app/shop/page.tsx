'use client';

import { useEffect, useMemo, useState } from 'react';
import { Grid, List, RefreshCw } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ProductCardCol from '@/components/ProductCardCol';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listProducts } from '@/lib/api/products';
import type { Paginated } from '@/lib/api/http';

type AnyProduct = {
  id: number;
  name: string;
  slug?: string;
  price: number;
  discount_price?: number | null;
  is_in_stock?: boolean;
  stock_quantity?: number;
  images?: { id: number; image: string; is_primary: boolean }[];
  main_image?: string | null;
  gallery_images?: { id: number; image: string; is_primary: boolean }[];
  [key: string]: any;
};

const PAGE_SIZE = 12;

export default function ShopPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'latest' | 'best-selling' | 'price-low' | 'price-high'>('latest');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paginated<AnyProduct> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const ordering = useMemo(() => {
    switch (sortBy) {
      case 'latest':
        return '-created_at';
      case 'best-selling':
        return '-is_best_seller';
      case 'price-low':
        return 'price';
      case 'price-high':
        return '-price';
      default:
        return '-created_at';
    }
  }, [sortBy]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await listProducts({
          page,
          page_size: PAGE_SIZE,
          ordering,
        });
        if (!alive) return;
        setData(res as Paginated<AnyProduct>);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || 'Failed to load products');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, ordering]);

  const total = data?.count ?? 0;
  const items = data?.results ?? [];
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="container mx-auto px-4 py-10 md:py-12">
      <h1 className="mb-6 text-2xl font-bold md:mb-8 md:text-3xl">Shop</h1>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
        <div className="flex items-center gap-4">
          <Select
            value={sortBy}
            onValueChange={(v: any) => {
              setSortBy(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Products</SelectItem>
              <SelectItem value="best-selling">Best Selling</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <p className="text-xs text-gray-600 sm:text-sm">
            {loading ? 'Loading…' : `Showing ${start}-${end} of ${total} products`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="mb-3 font-semibold">Couldn&apos;t load products</div>
          <Button
            variant="outline"
            onClick={() => {
              setErr(null);
              setLoading(true);
              setPage((p) => p);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-56 sm:h-64 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : viewMode === 'grid' ? (
        // ✅ 2 on mobile, 5 on desktop (compact gaps)
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((p) => (
            <ProductCardCol key={p.id} product={p as any} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-10 md:mt-12 flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!data?.previous}
        >
          Previous
        </Button>
        <Button variant="default">{page}</Button>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!data?.next}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
