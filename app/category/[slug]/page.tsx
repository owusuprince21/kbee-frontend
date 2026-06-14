// app/category/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import { createPageMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{
    page?: string;
    page_size?: string;
    ordering?: string;
    q?: string;
    brand?: string;
  }> | {
    page?: string;
    page_size?: string;
    ordering?: string;
    q?: string;
    brand?: string;
  };
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const normalize = (u?: string | null) =>
  u ? (u.startsWith('http://') ? u.replace(/^http:\/\//, 'https://') : u) : undefined;

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

function brandLabel(product: any) {
  return product?.brand_display || product?.brand || '';
}

function categoryBrandLinks(products: any[]) {
  const brands = new Map<string, string>();
  for (const product of products) {
    const slug = String(product?.brand || '').trim().toLowerCase();
    if (!slug || slug === 'undefined' || slug === 'null' || slug === 'accessories') continue;
    if (!brands.has(slug)) brands.set(slug, brandLabel(product));
  }
  return Array.from(brands.entries()).map(([brandSlug, name]) => ({
    slug: brandSlug,
    name: String(name || brandSlug),
  }));
}

function titleize(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = decodeURIComponent(resolvedParams.slug || '');

  if (!slug || slug === 'undefined' || slug === 'null') {
    return createPageMetadata({
      title: 'Category',
      description: 'Browse KBee Computers product categories in Ghana.',
      path: '/shop',
    });
  }

  try {
    const res = await fetch(`${API_BASE}/api/categories/${encodeURIComponent(slug)}/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error('Category not found');
    const category = await res.json();
    const name = category?.name || titleize(slug);
    return createPageMetadata({
      title: name,
      description:
        category?.description ||
        `Shop ${name} at KBee Computers Ghana. Find quality new and UK used products with reliable support and delivery.`,
      path: `/category/${slug}`,
      image: category?.image || category?.image_url || undefined,
    });
  } catch {
    const name = titleize(slug);
    return createPageMetadata({
      title: name,
      description: `Shop ${name} at KBee Computers Ghana.`,
      path: `/category/${slug}`,
    });
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const slug = decodeURIComponent(resolvedParams.slug || '');

  if (!slug || slug === 'undefined' || slug === 'null') {
    notFound();
  }

  const page     = Number(resolvedSearchParams.page ?? 1) || 1;
  const pageSize = Number(resolvedSearchParams.page_size ?? 24) || 24;
  const ordering = resolvedSearchParams.ordering || '-created_at';
  const query    = resolvedSearchParams.q && resolvedSearchParams.q !== 'undefined' ? resolvedSearchParams.q : undefined;
  const brand    = resolvedSearchParams.brand && resolvedSearchParams.brand !== 'undefined' ? resolvedSearchParams.brand : undefined;

  // 1) Get the category by slug (your backend has /api/categories/<slug>/)
  const catRes = await fetch(`${API_BASE}/api/categories/${encodeURIComponent(slug)}/`, {
    next: { revalidate: 60 },
  });

  if (!catRes.ok) {
    // Unknown category -> 404 page
    notFound();
  }

  const rawCat = await catRes.json();
  const category = {
    ...rawCat,
    image: rawCat.image ?? rawCat.image_url ?? null,
  };

  // 2) Now fetch products, filtering by the **category id** (NOT the slug)
  const prodRes = await fetch(
    `${API_BASE}/api/products/${qs({
      page,
      page_size: pageSize,
      ordering,
      search: query,
      brand,
      category: category.id, // <- IMPORTANT: filter by numeric id
    })}`,
    { next: { revalidate: 30 } }
  );

  let products: any[] = [];
  if (prodRes.ok) {
    const payload = await prodRes.json();
    products = Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload)
      ? payload
      : [];
  }
  const brandLinks = categoryBrandLinks(products);

  // Optional: if a valid category has *zero* products, show an empty state (not a full 404).
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-slate-600">{category.description}</p>
          )}
        </div>

        {category.image && (
          <div className="relative hidden h-16 w-16 overflow-hidden rounded-full ring-1 ring-slate-200 md:block">
            <img
              src={normalize(category.image) || '/placeholder.jpg'}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {brandLinks.length > 0 && (
        <div className="mb-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          Browse by brand:{' '}
          {brandLinks.map((item, index) => (
            <span key={item.slug}>
              {index > 0 && ' · '}
              <Link href={`/category/${slug}/brand/${item.slug}`} className="text-indigo-600 hover:underline">
                {item.name}
              </Link>
            </span>
          ))}
        </div>
      )}

      {products.length > 0 ? (
        <ProductGrid products={products as any} />
      ) : (
        <p className="py-20 text-center text-slate-500">No products found in this category.</p>
      )}
    </main>
  );
}
