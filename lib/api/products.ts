'use client';

import { http, buildQuery, type Paginated } from './http';
import type { Product } from '@/lib/types';

const emptyProducts: Paginated<Product> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export type ProductQuery = {
  search?: string;
  /** Accepts numeric id or slug; we’ll map to `category` or `category__slug`. */
  category?: string | number;
  /** BRAND IS A CHARFIELD on backend → send `brand=<string>` (not brand__slug) */
  brand?: string | number;
  ordering?: string;
  page?: number;
  page_size?: number;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  [extra: string]: unknown;
};

function isNumericLike(val: unknown) {
  return typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val));
}

function isBlankParam(val: unknown) {
  if (val === undefined || val === null || val === '') return true;
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    return normalized === '' || normalized === 'undefined' || normalized === 'null';
  }
  return false;
}

export async function listProducts(params?: ProductQuery) {
  const qp: Record<string, any> = { ...(params || {}) };

  for (const key of Object.keys(qp)) {
    if (isBlankParam(qp[key])) delete qp[key];
  }

  // Category (FK) supports slug lookup
  if (!isBlankParam(qp.category)) {
    if (isNumericLike(qp.category)) {
      qp.category = typeof qp.category === 'number' ? qp.category : Number(qp.category);
    } else {
      qp['category__slug'] = String(qp.category);
      delete qp.category;
    }
  }

  // Brand is a CharField → filter on `brand` directly
  if (!isBlankParam(qp.brand)) {
    if (isNumericLike(qp.brand)) {
      qp.brand = typeof qp.brand === 'number' ? qp.brand : Number(qp.brand);
    } else {
      qp.brand = String(qp.brand);
    }
  }

  // Booleans as strings DRF filter understands
  ['is_featured', 'is_new_arrival', 'is_best_seller'].forEach((k) => {
    if (!isBlankParam(qp[k])) qp[k] = String(Boolean(qp[k]));
  });

  try {
    return await http<Paginated<Product>>(`/products/${buildQuery(qp)}`);
  } catch {
    return emptyProducts;
  }
}

export async function getProduct(idOrSlug: number | string) {
  return http<Product>(`/products/${idOrSlug}/`);
}

export async function listFeatured(page_size = 12, page?: number) {
  const qp = buildQuery({ page_size, page });
  return http<Paginated<Product>>(`/products/featured/${qp}`);
}

export async function listNewArrivals(page_size = 12, page?: number) {
  const qp = buildQuery({ page_size, page });
  return http<Paginated<Product>>(`/products/new_arrivals/${qp}`);
}

export async function listBestSellers(page_size = 12, page?: number) {
  const qp = buildQuery({ page_size, page });
  return http<Paginated<Product>>(`/products/best_sellers/${qp}`);
}

export async function relatedByCategory(categorySlug: string, excludeId?: number, limit = 8) {
  const data = await listProducts({
    category: categorySlug,
    page_size: limit,
    ordering: '-updated_at',
  });
  const results = Array.isArray((data as any)?.results) ? data.results : [];
  const filtered = excludeId ? results.filter((p) => p.id !== excludeId) : results;
  return filtered.slice(0, limit);
}

export async function getRecentlyViewed(limit = 12) {
  const data = await listProducts({ ordering: '-updated_at', page_size: limit });
  return Array.isArray((data as any)?.results) ? data.results : [];
}

export const Products = {
  list: listProducts,
  getBySlug: getProduct,
  get: getProduct,
  listFeatured,
  listNewArrivals,
  listBestSellers,
  async getRelated(idOrSlug: number | string, limit = 8) {
    const p = await getProduct(idOrSlug);
    const slug = (p as any)?.category?.slug;
    if (!slug) return [];
    return relatedByCategory(slug, (p as any)?.id, limit);
  },
  getRecentlyViewed,
};
