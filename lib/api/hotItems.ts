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

async function getJsonArray(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[hotItems] fetch failed", res.status, url);
    }
    throw new Error(String(res.status));
  }
  const data = await res.json();
  return Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
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
