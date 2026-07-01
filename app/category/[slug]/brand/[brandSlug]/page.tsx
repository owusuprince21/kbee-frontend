// app/category/[slug]/brand/[brandSlug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import { createPageMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug: string; brandSlug: string }>;
  searchParams: Promise<{
    page?: string;
    page_size?: string;
    ordering?: string;
    q?: string;
  }>;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

function qs(params: Record<string, any>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'string' && ['undefined', 'null', ''].includes(v.trim().toLowerCase())) continue;
    s.append(k, String(v));
  }
  const q = s.toString();
  return q ? `?${q}` : '';
}

function titleize(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function fetchJson<T>(url: string, revalidate = 60): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

function extractProducts(payload: any): any[] {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

function displayBrand(products: any[], fallback: string) {
  return products.find((p) => p?.brand_display)?.brand_display || titleize(fallback);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const categorySlug = decodeURIComponent(resolvedParams.slug || '');
  const brandSlug = decodeURIComponent(resolvedParams.brandSlug || '');

  const categoryName = titleize(categorySlug);
  const brandName = titleize(brandSlug);

  if (!categorySlug || !brandSlug || categorySlug === 'undefined' || brandSlug === 'undefined') {
    return createPageMetadata({
      title: 'Shop by Brand',
      description: 'Browse KBee Computers products by category and brand.',
      path: '/shop',
    });
  }

  return createPageMetadata({
    title: `${brandName} ${categoryName}`,
    description: `Shop ${brandName} ${categoryName} at KBee Computers Ghana with quality products, support, and delivery.`,
    path: `/category/${categorySlug}/brand/${brandSlug}`,
  });
}

export default async function CategoryByBrandPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const categorySlug = decodeURIComponent(resolvedParams.slug || '');
  const brandSlug = decodeURIComponent(resolvedParams.brandSlug || '');

  if (
    !categorySlug ||
    categorySlug === 'undefined' ||
    categorySlug === 'null' ||
    !brandSlug ||
    brandSlug === 'undefined' ||
    brandSlug === 'null'
  ) {
    notFound();
  }

  const page = Number(resolvedSearchParams.page ?? 1) || 1;
  const pageSize = Number(resolvedSearchParams.page_size ?? 24) || 24;
  const ordering = resolvedSearchParams.ordering || '-created_at';
  const query =
    resolvedSearchParams.q && resolvedSearchParams.q !== 'undefined'
      ? resolvedSearchParams.q
      : undefined;

  let category: any;
  try {
    category = await fetchJson<any>(
      `${API_BASE}/api/categories/${encodeURIComponent(categorySlug)}/`,
      120
    );
    if (!category?.id) throw new Error('No category id');
  } catch {
    notFound();
  }

  let products: any[] = [];
  try {
    const payload = await fetchJson<any>(
      `${API_BASE}/api/products/${qs({
        page,
        page_size: pageSize,
        ordering,
        search: query,
        category: category.id,
        brand: brandSlug,
      })}`,
      30
    );
    products = extractProducts(payload);
  } catch {
    products = [];
  }

  const categoryName = category?.name || titleize(categorySlug);
  const brandName = displayBrand(products, brandSlug);

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {categoryName} - {brandName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Showing {brandName} products in {categoryName}.
          </p>
        </div>
        <Link
          href={`/category/${categorySlug}`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 hover:text-white"
        >
          Back to {categoryName}
        </Link>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products as any} />
      ) : (
        <p className="py-20 text-center text-slate-500">
          No {brandName} products found in this category.
        </p>
      )}
    </main>
  );
}
