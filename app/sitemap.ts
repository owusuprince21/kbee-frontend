import type { MetadataRoute } from 'next';
import { apiBaseUrl, siteUrl } from '@/lib/seo';

const API_BASE = apiBaseUrl;

type SitemapEntry = MetadataRoute.Sitemap[number];

function route(
  path: string,
  priority: number,
  changeFrequency: SitemapEntry['changeFrequency']
): SitemapEntry {
  return {
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

function extractList(payload: unknown): any[] {
  if (
    payload &&
    typeof payload === 'object' &&
    'results' in payload &&
    Array.isArray((payload as any).results)
  ) {
    return (payload as any).results;
  }

  if (Array.isArray(payload)) return payload;

  return [];
}

async function fetchList(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    return extractList(await res.json());
  } catch {
    return [];
  }
}

function safeDate(value?: string | null): Date {
  if (!value) return new Date();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
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
    .map((category: any) =>
      route(`/category/${category.slug}`, 0.85, 'weekly')
    );

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((product: any) => product?.slug)
    .map((product: any) => ({
      ...route(`/product/${product.slug}`, 0.9, 'weekly'),
      lastModified: safeDate(product?.updated_at),
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}