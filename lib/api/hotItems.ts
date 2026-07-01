// lib/api/hotItems.ts
export type HotItemAPI = {
  id: number;
  title?: string | null;
  product_title?: string | null;
  specs?: string | null;

  cta_text?: string | null;
  cta_href?: string | null;
  image_url?: string | null;
  is_running?: boolean;

  // Optional flattened snapshots
  product_name?: string | null;
  product_description?: string | null;
  product_slug?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  brand?: string | null;

  // Pricing snapshot from serializer (strings)
  price?: string | null;
  compare_at_price?: string | null;

  // Images
  main_image_url?: string | null;
  gallery_images?: { id: number; image_url: string; is_primary: boolean }[];

  // (optional nested product if you add it later)
  product?: {
    name?: string | null;
    slug?: string | null;
    description?: string | null;
    price?: string | number | null;
    discount_price?: string | number | null;
    main_image_url?: string | null;
    images?: { image?: string | null }[];
    brand?: string | null;
    category?: { name?: string | null; slug?: string | null } | null;
  } | null;
};

const CACHE_MS = 60_000;
const hotItemsCache = new Map<string, { expiresAt: number; data: HotItemAPI[] }>();
const inflight = new Map<string, Promise<HotItemAPI[]>>();

function buildApiRoot() {
  // Accept either env var; normalize trailing slashes and optional /api suffix
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL ||
               process.env.NEXT_PUBLIC_API_URL ||
               "").replace(/\/+$/, "");

  // If nothing provided, you can fallback to "/api" ONLY if your Next dev/proxy forwards to Django.
  if (!raw) return "/api";

  // If user already included /api, keep it; otherwise append it
  return /\/api$/.test(raw) ? raw : `${raw}/api`;
}

async function getJsonArray(url: string): Promise<HotItemAPI[]> {
  const cached = hotItemsCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const pending = inflight.get(url);
  if (pending) return pending;

  const request = (async () => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      if (res.status !== 429 && process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("[hotItems] fetch failed", res.status, url);
      }
      return [];
    }
    const data = await res.json();
    const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    hotItemsCache.set(url, { expiresAt: Date.now() + CACHE_MS, data: arr as HotItemAPI[] });
    return arr as HotItemAPI[];
  })().finally(() => {
    inflight.delete(url);
  });

  inflight.set(url, request);
  return request;
}

export async function listHotItems(which: "active" | "all" = "active"): Promise<HotItemAPI[]> {
  const api = buildApiRoot();
  const url = `${api}/hot-items/${which === "active" ? "active/" : ""}`; // keep trailing slash

  try {
    const arr = await getJsonArray(url);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[hotItems] using", url, "→", arr.length, "items");
    }
    return arr as HotItemAPI[];
  } catch {
    return [];
  }
}
