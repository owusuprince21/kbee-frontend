import { http, type Paginated } from './http';

export type Category = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  description?: string | null;
};

type BackendCategory = {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  icon?: string | null;
  description?: string | null;
};

function normalizeUrl(u?: string | null): string | null {
  if (!u) return null;
  let out = u.trim();
  if (!out) return null;
  if (out.startsWith('/')) {
    const base = (process.env.NEXT_PUBLIC_MEDIA_URL || '').replace(/\/+$/, '');
    if (base) out = `${base}${out}`;
  }
  if (out.startsWith('http://')) out = out.replace(/^http:\/\//, 'https://');
  return out;
}

function mapCategory(row: BackendCategory): Category {
  const rawImage = row.image_url ?? row.image ?? row.thumbnail ?? row.icon ?? null;
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    image: normalizeUrl(rawImage),
    description: row.description ?? null,
  };
}

export async function listCategories(): Promise<Category[]> {
  // ✅ NO /api here because BASE_URL already ends with /api
  const data = await http<BackendCategory[] | Paginated<BackendCategory>>(
    '/categories/?page_size=100'
  );

  const rows =
    Array.isArray((data as Paginated<BackendCategory>)?.results)
      ? (data as Paginated<BackendCategory>).results
      : (data as BackendCategory[]);

  return (rows || []).map(mapCategory);
}
