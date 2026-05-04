// app/category/laptops/brand/[slug]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';

type PageProps = {
  params: { slug: string }; // brand slug
  searchParams: {
    page?: string;
    page_size?: string;
    ordering?: string;
    q?: string;
  };
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

function qs(params: Record<string, any>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    s.append(k, String(v));
  }
  const q = s.toString();
  return q ? `?${q}` : '';
}

function titleize(s: string) {
  return s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
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

export default async function LaptopsByBrandPage({ params, searchParams }: PageProps) {
  const brandSlug = decodeURIComponent(params.slug);

  const page     = Number(searchParams.page ?? 1) || 1;
  const pageSize = Number(searchParams.page_size ?? 24) || 24;
  const ordering = searchParams.ordering || '-created_at';
  const query    = searchParams.q || undefined;

  // 1) Get the laptops category (by slug) to retrieve its numeric id
  let categoryId: number;
  try {
    const cat = await fetchJson<any>(`${API_BASE}/api/categories/laptops/`, 120);
    categoryId = Number(cat?.id);
    if (!categoryId) throw new Error('No category id');
  } catch {
    // If the "laptops" category doesn't exist, brand pages make no sense.
    notFound();
  }

  // 2) Fetch products filtered by category id and brand.
  //    Try `brand` first; if empty, try `brand__slug` for DRF-style filtersets.
  let products: any[] = [];
  try {
    const first = await fetchJson<any>(
      `${API_BASE}/api/products/${qs({
        page,
        page_size: pageSize,
        ordering,
        search: query,
        category: categoryId,
        brand: brandSlug,
      })}`,
      30
    );
    products = extractProducts(first);

    if (products.length === 0) {
      const second = await fetchJson<any>(
        `${API_BASE}/api/products/${qs({
          page,
          page_size: pageSize,
          ordering,
          search: query,
          category: categoryId,
          brand__slug: brandSlug,
        })}`,
        30
      );
      products = extractProducts(second);
    }
  } catch {
    products = [];
  }

  const brandTitle = titleize(brandSlug);

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Laptops — {brandTitle}</h1>
        <Link href="/category/laptops" className="text-indigo-600 hover:underline">
          Back to all Laptops
        </Link>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products as any} />
      ) : (
        <p className="py-20 text-center text-slate-500">
          No {brandTitle} laptops found.
        </p>
      )}
    </main>
  );
}
