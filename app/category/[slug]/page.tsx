// app/category/[slug]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';

type PageProps = {
  params: { slug: string };
  searchParams: {
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
    s.append(k, String(v));
  }
  const q = s.toString();
  return q ? `?${q}` : '';
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const slug = decodeURIComponent(params.slug);

  const page     = Number(searchParams.page ?? 1) || 1;
  const pageSize = Number(searchParams.page_size ?? 24) || 24;
  const ordering = searchParams.ordering || '-created_at';
  const query    = searchParams.q || undefined;
  const brand    = searchParams.brand || undefined;

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
            <Image
              src={normalize(category.image) || '/placeholder.jpg'}
              alt={category.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}
      </div>

      {slug === 'laptops' && (
        <div className="mb-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          Browse laptops by brand:{' '}
          <Link href="/category/laptops/brand/dell" className="text-indigo-600 hover:underline">Dell</Link>{' · '}
          <Link href="/category/laptops/brand/hp" className="text-indigo-600 hover:underline">HP</Link>{' · '}
          <Link href="/category/laptops/brand/lenovo" className="text-indigo-600 hover:underline">Lenovo</Link>{' · '}
          <Link href="/category/laptops/brand/apple" className="text-indigo-600 hover:underline">Apple</Link>
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
