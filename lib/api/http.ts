'use client';

export class ApiError extends Error {
  status: number;
  data: any;
  url?: string;
  constructor(status: number, data: any, message?: string, url?: string) {
    super(message || (data?.detail || 'Request failed'));
    this.status = status;
    this.data = data;
    this.url = url;
  }
}

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
const BASE_URL = RAW_BASE.replace(/\/+$/, ''); // strip trailing slash

/** Join base + path and avoid /api/api when base already ends with /api */
function resolveApiUrl(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path; // absolute url already
  const b = base.replace(/\/+$/, '');
  let p = (path || '').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (b.endsWith('/api') && p.startsWith('/api/')) {
    p = p.slice(4); // drop leading "/api"
    if (!p.startsWith('/')) p = `/${p}`;
  }
  return `${b}${p}`;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

function safeParse(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}

export async function http<T = any>(
  path: string,
  {
    method = 'GET',
    body,
    headers,
    isForm = false,
  }: { method?: HttpMethod; body?: any; headers?: HeadersInit; isForm?: boolean } = {}
): Promise<T> {
  const url = resolveApiUrl(BASE_URL, path);

  const h = new Headers();
  // Only set Content-Type when we actually send a body (avoids preflight on GET)
  if (body && !isForm) h.set('Content-Type', 'application/json');
  h.set('Accept', 'application/json');

  if (headers) {
    if (headers instanceof Headers) headers.forEach((v, k) => h.set(k, v));
    else if (Array.isArray(headers)) headers.forEach(([k, v]) => h.set(k, v));
    else Object.entries(headers).forEach(([k, v]) => h.set(k, v as string));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: h,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      cache: 'no-store',
      // mode: 'cors', // default; add explicitly if you like
    });
  } catch (err: any) {
    // Network/CORS/mixed-content/offline error: no Response object
    throw new ApiError(0, { detail: err?.message || 'Network error' }, 'Failed to fetch', url);
  }

  if (res.status === 204) return null as T;

  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data, undefined, url);
  }

  return data as T;
}

/** DRF pagination */
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
