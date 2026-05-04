// app/search/page.tsx
import ProductGrid from '@/components/ProductGrid';

type PageProps = {
  searchParams: { q?: string; page?: string; page_size?: string; ordering?: string };
};

async function fetchProducts(q = '', page = 1, pageSize = 24, ordering = '-created_at') {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ordering,
    search: q,
  });
  const res = await fetch(`${base}/api/products/?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
}

export default async function SearchPage({ searchParams }: PageProps) {
  const q        = (searchParams.q || '').trim();
  const page     = Number(searchParams.page || 1) || 1;
  const pageSize = Number(searchParams.page_size || 24) || 24;
  const ordering = searchParams.ordering || '-created_at';

  const products = await fetchProducts(q, page, pageSize, ordering);

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {q ? <>Search results for “{q}”</> : 'All Products'}
        </h1>
        {!!q && <p className="mt-1 text-slate-600">Showing items that match your search.</p>}
      </div>

      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <p className="py-20 text-center text-slate-500">
          {q ? 'No products match your search.' : 'No products to show yet.'}
        </p>
      )}
    </main>
  );
}
