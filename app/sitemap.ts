import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

type SitemapEntry = MetadataRoute.Sitemap[number];

function route(path: string, priority: number, changeFrequency: SitemapEntry['changeFrequency']): SitemapEntry {
  return {
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

function extractList(payload: any) {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

async function fetchList(path: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return extractList(await res.json());
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    fetchList('/api/categories/?page_size=100'),
    fetchList('/api/products/?page_size=200&ordering=-updated_at'),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    route('/', 1, 'daily'),
    route('/shop', 0.95, 'daily'),
    route('/about', 0.75, 'monthly'),
    route('/contact', 0.65, 'monthly'),
    route('/faq', 0.55, 'monthly'),
    route('/policies/privacy', 0.35, 'yearly'),
    route('/policies/returns', 0.35, 'yearly'),
    route('/policies/cookies', 0.35, 'yearly'),
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category: any) => category?.slug)
    .map((category: any) => route(`/category/${category.slug}`, 0.85, 'weekly'));

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((product: any) => product?.slug)
    .map((product: any) => ({
      ...route(`/product/${product.slug}`, 0.9, 'weekly'),
      lastModified: product?.updated_at ? new Date(product.updated_at) : new Date(),
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
