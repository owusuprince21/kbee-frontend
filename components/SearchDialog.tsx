// components/SearchDialog.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listProducts } from '@/lib/api/products';
import { formatGHS } from '@/lib/currencyformat';
import type { Product } from '@/lib/types';

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export default function SearchDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'products'>('all');
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await listProducts({ page_size: 100, ordering: '-updated_at' });
        if (!cancelled) setItems(res.results ?? (res as any) ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  const submitFullSearch = () => {
    onOpenChange(false);
    const q = query.trim();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="
          p-0 overflow-hidden rounded-xl
          w-[86vw] max-w-[86vw]
          sm:w-[92vw] sm:max-w-[min(1100px,92vw)]
        "
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Site search</DialogTitle>
          <DialogDescription>Search products and pages</DialogDescription>
        </DialogHeader>

        <div className="flex h-[min(80vh,calc(100svh-6rem))] flex-col">
          {/* Header (sticky) */}
          <div className="sticky top-0 z-10 border-b bg-white">
            <div className="flex items-center justify-between p-3 sm:p-4">
              {/* Make the input a bit narrower & shorter on mobile */}
              <div className="relative w-full max-w-[78vw] sm:max-w-none">
                <Input
                  autoFocus
                  placeholder="Type anything to search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitFullSearch()}
                  className="
                    h-10 text-sm pl-3
                    sm:h-12 sm:text-base sm:pl-4
                  "
                />
              </div>
              <DialogClose asChild>
                <button
                  className="ml-2 rounded-full p-2 hover:bg-gray-100 sm:ml-3"
                  aria-label="Close search dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-t px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
              {(['all', 'products'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`
                    rounded-lg border px-3 py-1.5 text-xs font-medium
                    sm:px-4 sm:py-2 sm:text-sm
                    ${tab === t
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50'}
                  `}
                >
                  {t === 'all' ? 'All' : 'Products'}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable results */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 overscroll-contain sm:p-4">
            <h3 className="mb-2 text-lg font-bold sm:mb-3 sm:text-xl">Products</h3>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-14 w-14 animate-pulse rounded-lg bg-gray-100 sm:h-16 sm:w-16" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100 sm:h-5" />
                  </div>
                ))}
              </div>
            ) : filtered.length ? (
              <ul className="space-y-3 sm:space-y-4">
                {filtered.map((p) => {
                  const price = Number(p.price);
                  const d = p.discount_price != null ? Number(p.discount_price) : undefined;
                  const hasDisc = typeof d === 'number' && d < price;
                  const cover = p.images?.[0]?.image || '/placeholder.jpg';
                  const slug = p.slug || String(p.id);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/product/${slug}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 sm:gap-4"
                        onClick={() => onOpenChange(false)}
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100 sm:h-16 sm:w-16">
                          <Image src={cover} alt={p.name} fill className="object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold text-slate-900 sm:text-[17px]">
                            {p.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 sm:mt-1">
                            {hasDisc ? (
                              <>
                                <span className="text-xs text-gray-400 line-through sm:text-sm">
                                  {formatGHS(price)}
                                </span>
                                <span className="text-sm font-semibold text-slate-900 sm:text-base">
                                  {formatGHS(d!)}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-slate-900 sm:text-base">
                                {formatGHS(price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 text-center text-slate-500 sm:py-10">
                {query ? 'No items match your search.' : 'No products available yet.'}
              </p>
            )}
          </div>

          {/* Footer (sticky) */}
          <div className="sticky bottom-0 z-10 border-t bg-white p-3 sm:p-4">
            <div className="flex items-center justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="h-9 px-3 text-sm sm:h-10 sm:px-4 sm:text-base">
                  Close
                </Button>
              </DialogClose>
              <Button
                onClick={submitFullSearch}
                disabled={!query.trim()}
                className="h-9 px-3 text-sm sm:h-10 sm:px-4 sm:text-base"
              >
                View all results
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
