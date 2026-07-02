'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listCategories } from '@/lib/api/categories';

type UiCategory = { slug: string; name: string; image: string | null | undefined };

function validSlug(slug: unknown) {
  const value = String(slug || '').trim().toLowerCase();
  return Boolean(value && value !== 'undefined' && value !== 'null');
}

function initials(name: string) {
  const [a = '', b = ''] = name.trim().split(/\s+/);
  return (a[0] || '').concat(b[0] || '').toUpperCase() || '🖼️';
}

export default function BrowseByCategory({ categories: categoriesProp }: { categories?: UiCategory[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [fetched, setFetched] = useState<UiCategory[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (categoriesProp?.length) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await listCategories();
        if (!cancelled) {
          setFetched(
            data
              .filter((c) => validSlug(c.slug))
              .map(c => ({ slug: c.slug, name: c.name, image: c.image ?? null }))
          );
        }
      } catch {
        if (!cancelled) setFetched([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [categoriesProp, mounted]);

  const categories: UiCategory[] = useMemo(
    () => (mounted && categoriesProp?.length ? categoriesProp : fetched ?? []).filter((c) => validSlug(c.slug)),
    [categoriesProp, fetched, mounted]
  );

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(320, el.clientWidth);
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          {/* smaller heading on mobile and desktop */}
          <h2 className="text-xl font-bold md:text-2xl">Browse by Category</h2>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="rounded-full" onClick={() => scrollByDir(-1)} aria-label="Previous">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="outline" className="rounded-full" onClick={() => scrollByDir(1)} aria-label="Next">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-10 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <style jsx>{`div::-webkit-scrollbar{display:none}`}</style>

          {(!mounted || loading) && categories.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              // narrower item + smaller skeleton circle
              <div key={i} className="w-[110px] shrink-0 md:w-[140px]">
                <div className="mx-auto mt-4 h-[80px] w-[80px] animate-pulse rounded-full bg-gray-100 md:h-[100px] md:w-[100px]" />
                <div className="mx-auto mt-3 h-4 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            ))
          ) : categories.length > 0 ? (
            categories.map((c) => (
              // narrower item
              <a key={c.slug} href={`/category/${c.slug}`} className="group w-[110px] shrink-0 snap-start md:w-[140px]">
                {/* smaller image circle on mobile & desktop */}
                <div className="mx-auto mt-4 flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 md:h-[100px] md:w-[100px]">
                  {c.image ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        sizes="(max-width:768px) 80px, 100px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        // unoptimized
                      />
                    </div>
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-50 to-slate-200 text-sm font-bold text-slate-500">
                      {initials(c.name)}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-center text-sm font-semibold text-slate-900 transition-colors group-hover:text-amber-600">
                  {c.name}
                </h3>
              </a>
            ))
          ) : (
            <p className="py-6 text-sm text-slate-500">No categories found.</p>
          )}
        </div>
      </div>
    </section>
  );
}
