'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Image as ImageIcon,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  CreditCard,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

import type { Product } from '@/lib/types';
import { getProduct, listProducts } from '@/lib/api/products';
import { useAddToCartMutation, useAddToWishlistMutation } from '@/lib/api/commerce';
import { formatGHS } from '@/lib/currencyformat';
import { addRecentlyViewed } from '@/lib/recentlyViewed';
import ProductCard from '@/components/ProductCard';
import ReviewForm from '@/components/reviews/ReviewForm';

function normalizeUrl(u?: string | null) {
  if (!u) return undefined;
  return u.startsWith('http://') ? u.replace(/^http:\/\//, 'https://') : u;
}

function sameProduct(product: Product, idOrSlug?: string) {
  if (!idOrSlug) return false;
  return String(product.slug || '') === idOrSlug || String(product.id) === idOrSlug;
}

function findProductInValue(value: unknown, idOrSlug?: string): Product | undefined {
  if (!value || !idOrSlug) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProductInValue(item, idOrSlug);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object') return undefined;
  const record = value as any;
  if (record.id && sameProduct(record as Product, idOrSlug)) return record as Product;
  return (
    findProductInValue(record.results, idOrSlug) ||
    findProductInValue(record.heroProducts, idOrSlug) ||
    findProductInValue(record.newArrivals, idOrSlug) ||
    findProductInValue(record.bestSelling, idOrSlug) ||
    findProductInValue(record.products, idOrSlug)
  );
}

function humanizeKey(k: string) {
  return k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function getSpecLines(raw: unknown): string[] {
  const val: any = raw;
  if (val == null) return [];

  if (typeof val === 'string') {
    const t = val.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed).map(([k, v]) => `${humanizeKey(k)}: ${String(v)}`);
      }
    } catch {
      // ignore
    }
    return t
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${humanizeKey(k)}: ${String(v)}`);
  }

  return [];
}

/** Simple, light gallery carousel (no extra deps). */
function GalleryCarousel({
  images,
  activeIndex,
  onSelect,
}: {
  images: string[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollByThumbs = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.8) * dir;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (images.length <= 1) return null;

  return (
    <div className="relative">
      {images.length > 5 && (
        <>
          <button
            type="button"
            onClick={() => scrollByThumbs(-1)}
            aria-label="Scroll thumbnails left"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow ring-1 ring-black/5 hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByThumbs(1)}
            aria-label="Scroll thumbnails right"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow ring-1 ring-black/5 hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div ref={trackRef} className="no-scrollbar flex gap-2 overflow-x-auto px-8 pb-1">
        {images.map((src, i) => {
          const selected = i === activeIndex;
          return (
            <button
              key={src + i}
              type="button"
              onClick={() => onSelect(i)}
              className={[
                'relative shrink-0 overflow-hidden rounded-xl ring-1 transition',
                selected ? 'ring-amber-600' : 'ring-black/10 hover:ring-amber-300',
                'h-14 w-14 sm:h-16 sm:w-16',
              ].join(' ')}
              aria-label={`Select image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`Thumb ${i + 1}`}
                fill
                sizes="(max-width: 640px) 56px, 64px"
                className="object-contain bg-slate-50"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ZoomableLightboxImage({ src, alt }: { src: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const pos = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  const resetPan = () => {
    pos.current = { x: 0, y: 0 };
    wrapRef.current?.style.setProperty('--tx', '0px');
    wrapRef.current?.style.setProperty('--ty', '0px');
  };

  const toggleZoom = () => {
    setZoom((z) => {
      const nz = z === 1 ? 2 : 1;
      if (nz === 1) resetPan();
      return nz;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom === 1) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || zoom === 1) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    pos.current = { x: pos.current.x + dx, y: pos.current.y + dy };
    wrapRef.current?.style.setProperty('--tx', `${pos.current.x}px`);
    wrapRef.current?.style.setProperty('--ty', `${pos.current.y}px`);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden touch-pan-y">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={toggleZoom}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="h-full w-full select-none object-contain bg-black"
        style={{
          transform: `translate(var(--tx, 0px), var(--ty, 0px)) scale(${zoom})`,
          transition: dragging.current ? 'none' : 'transform 160ms ease',
          touchAction: zoom === 1 ? 'manipulation' : 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />
      <div className="pointer-events-none absolute right-3 top-3 rounded bg-black/50 px-2 py-1 text-xs text-white">
        {zoom === 1 ? 'Tap/Click to zoom' : 'Drag to pan · Tap to reset'}
      </div>
    </div>
  );
}

const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^\d]/g, '');

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);

  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedCover, setDisplayedCover] = useState('/placeholder.jpg');

  const [openLightbox, setOpenLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const addToCart = useAddToCartMutation();
  const addToWishlist = useAddToWishlistMutation();

  const productQuery = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug as string),
    enabled: Boolean(slug),
    staleTime: 0,
    gcTime: 1000 * 60 * 60 * 6,
    refetchOnMount: true,
    placeholderData: () => {
      const cachedProduct = queryClient.getQueryData<Product>(['product', slug]);
      if (cachedProduct) return cachedProduct;
      const publicQueries = queryClient.getQueriesData({ queryKey: ['home'] });
      for (const [, data] of publicQueries) {
        const found = findProductInValue(data, slug);
        if (found) return found;
      }
      const productLists = queryClient.getQueriesData({ queryKey: ['products'] });
      for (const [, data] of productLists) {
        const found = findProductInValue(data, slug);
        if (found) return found;
      }
      return undefined;
    },
  });

  const product = productQuery.data ?? null;
  const brandSlug = String((product as any)?.brand || '').trim();

  const relatedQuery = useQuery({
    queryKey: ['related-products', brandSlug, product?.id],
    queryFn: async () => {
      const data = await listProducts({ brand: brandSlug, page_size: 16, ordering: '-updated_at' });
      const rows = Array.isArray((data as any)?.results) ? (data as any).results : [];
      return rows.filter((item: Product) => item.id !== product?.id);
    },
    enabled: Boolean(product?.id && brandSlug),
    staleTime: 0,
    gcTime: 1000 * 60 * 60 * 6,
    refetchOnMount: true,
  });
  const related: Product[] = relatedQuery.data ?? [];

  useEffect(() => {
    if (productQuery.isError) {
      toast.error((productQuery.error as any)?.message || 'Failed to load product');
      router.push('/shop');
    }
  }, [productQuery.error, productQuery.isError, router]);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setActiveIndex(0);
    setLightboxIndex(0);
    addRecentlyViewed(product);
  }, [product?.id]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const main =
      normalizeUrl((product as any).main_image_url) ||
      normalizeUrl((product as any).main_image);

    const extra =
      Array.isArray((product as any).gallery_images) && (product as any).gallery_images.length > 0
        ? (product as any).gallery_images.map((g: any) => normalizeUrl(g?.image_url ?? g?.image)).filter(Boolean)
        : Array.isArray((product as any).images)
          ? (product as any).images.map((im: any) => normalizeUrl(im?.image)).filter(Boolean)
          : [];

    const combined = [main, ...extra].filter(Boolean) as string[];
    return Array.from(new Set(combined));
  }, [product]);

  const cover = gallery[activeIndex] || '/placeholder.jpg';

  useEffect(() => {
    if (activeIndex >= gallery.length) setActiveIndex(0);
  }, [activeIndex, gallery.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gallery.forEach((src) => {
      const img = new window.Image();
      img.decoding = 'async';
      img.src = src;
    });
  }, [gallery]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setDisplayedCover(cover);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!cancelled) setDisplayedCover(cover);
    };
    img.onerror = () => {
      if (!cancelled) setDisplayedCover(cover);
    };
    img.src = cover;
    if (img.complete) setDisplayedCover(cover);
    return () => {
      cancelled = true;
    };
  }, [cover]);

  const price = Number(product?.price || 0);
  const discount = product?.discount_price != null ? Number(product.discount_price) : null;

  const hasDiscount = discount !== null && discount < price;
  const finalPrice = hasDiscount ? discount! : price;
  const discountPercent = hasDiscount ? Math.round(((price - discount!) / price) * 100) : 0;

  const inStock =
    product?.is_in_stock ??
    (typeof product?.stock_quantity === 'number' ? product.stock_quantity > 0 : true);

  const brand = (product as any)?.brand?.name ?? (product as any)?.brand ?? '—';
  const categoryName = (product as any)?.category?.name ?? 'Computers';
  const stockQty = Number((product as any)?.stock_quantity ?? 0);

  const specsRaw =
    (product as any)?.specifications ??
    (product as any)?.specs ??
    (product as any)?.details;

  const specLines = useMemo(() => getSpecLines(specsRaw), [specsRaw]);

  // WhatsApp message now includes specifications (limited for link length)
  const chatLink = useMemo(() => {
    if (!product) return '#';

    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/product/${product.slug || product.id}`
        : '';

    const maxSpecs = 50;
    const specsText =
      specLines.length > 0
        ? `\n\nSpecifications:\n${specLines
            .slice(0, maxSpecs)
            .map((s) => `• ${s}`)
            .join('\n')}${specLines.length > maxSpecs ? `\n…+${specLines.length - maxSpecs} more` : ''}`
        : '';

    const msg =
      `Hello Kbee, I'm interested in:\n` +
      `${product.name}\n` +
      `Price: ${formatGHS(finalPrice)}` +
      `${specsText}\n\n` +
      `Link: ${url}`;

    return WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
      : '#';
  }, [product, finalPrice, specLines]);

  const handleAddToCart = async () => {
    if (!product || !inStock) return;
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity });
      toast.success('Added to cart.');
    } catch (err: any) {
      toast.error(err?.data?.detail || 'Could not add to cart.');
    }
  };

  const handleBuyNow = async () => {
    if (!product || !inStock) return;
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity });
      router.push('/cart');
    } catch (err: any) {
      toast.error(err?.data?.detail || 'Could not add to cart.');
    }
  };

  const handleWishlist = async () => {
    if (!product || !inStock) return;
    try {
      await addToWishlist.mutateAsync(product.id);
      toast.success('Saved to wishlist.');
    } catch (err: any) {
      toast.error(err?.data?.detail || 'Could not save to wishlist.');
    }
  };

  useEffect(() => {
    if (!openLightbox) return;

    const onKey = (e: KeyboardEvent) => {
      if (!gallery.length) return;
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % gallery.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + gallery.length) % gallery.length);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openLightbox, gallery.length]);

  if (productQuery.isLoading && !product) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-[340px] w-full animate-pulse rounded-2xl bg-gray-100" />
          <div className="space-y-3">
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-gray-100" />
            <div className="h-32 w-full animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      {/* Top section */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10 lg:items-start">
        {/* LEFT: Images (sticky on desktop) */}
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 sm:p-4 lg:sticky lg:top-6">
          <button
            type="button"
            onClick={() => {
              setLightboxIndex(activeIndex);
              setOpenLightbox(true);
            }}
            className="relative w-full overflow-hidden rounded-2xl bg-slate-50"
            aria-label="Open image viewer"
          >
            <div className="relative h-[260px] sm:h-[300px] lg:h-[340px]">
              <Image
                src={displayedCover}
                alt={product.name}
                fill
                priority
                loading="eager"
                className="object-contain"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </div>

            {!inStock ? (
              <span className="absolute left-3 top-3 rounded-full bg-gray-950 px-3 py-1 text-xs font-bold text-white">
                Out of Stock
              </span>
            ) : hasDiscount ? (
              <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                {discountPercent}% OFF
              </span>
            ) : null}
          </button>

          <div className="mt-3">
            <GalleryCarousel images={gallery} activeIndex={activeIndex} onSelect={setActiveIndex} />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {gallery.length} image{gallery.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => {
                setLightboxIndex(activeIndex);
                setOpenLightbox(true);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-gray-50"
            >
              <ImageIcon className="h-4 w-4" />
              View gallery
            </button>
          </div>
        </div>

        {/* RIGHT: Info */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <Link href="/shop" className="text-sm font-medium text-gray-500 hover:text-gray-700">
              ← Back to shop
            </Link>

            <span
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold',
                inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
              ].join(' ')}
            >
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              {categoryName}
            </span>
            {product.is_new_arrival ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                New arrival
              </span>
            ) : null}
            {product.is_best_seller ? (
              <span className="rounded-full bg-slate-50 px-3 py-1 font-semibold text-slate-800">
                Best seller
              </span>
            ) : null}
            {product.is_featured ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                Featured
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-end gap-3">
            {hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-sm text-gray-400 line-through">{formatGHS(price)}</span>
                <span className="text-3xl font-extrabold text-amber-600">
                  {formatGHS(discount!)}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-extrabold text-gray-900">{formatGHS(price)}</span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {product.condition}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Brand: {brand}
            </span>
          </div>

          {product.description ? (
            <p className="mt-5 text-sm leading-6 text-gray-600">{product.description}</p>
          ) : (
            <p className="mt-5 text-sm leading-6 text-gray-500">No description provided.</p>
          )}

          <div className="mt-6 rounded-2xl border bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">Quantity</div>
                <div className="mt-1 text-xs text-gray-500">
                  {inStock
                    ? stockQty > 0
                      ? `${stockQty} available`
                      : 'Available for order'
                    : 'Currently unavailable'}
                </div>
              </div>
              <div className="flex items-center rounded-xl border bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="grid h-10 w-10 place-items-center rounded-l-xl text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="grid h-10 min-w-12 place-items-center border-x px-3 text-sm font-semibold">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(stockQty > 0 ? stockQty : 99, q + 1))}
                  disabled={stockQty > 0 && quantity >= stockQty}
                  className="grid h-10 w-10 place-items-center rounded-r-xl text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                className="h-11 w-full rounded-xl bg-amber-600 font-semibold text-white transition hover:bg-amber-700"
                onClick={handleAddToCart}
                disabled={!inStock || addToCart.isPending}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Button
                className="h-11 w-full rounded-xl bg-gray-950 font-semibold text-white transition hover:bg-gray-800"
                onClick={handleBuyNow}
                disabled={!inStock || addToCart.isPending}
              >
                Buy Now
              </Button>
            </div>

            <button
              type="button"
              onClick={handleWishlist}
              disabled={!inStock || addToWishlist.isPending}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-red-600"
            >
              <Heart className="h-4 w-4" />
              {!inStock ? 'Wishlist unavailable' : addToWishlist.isPending ? 'Saving...' : 'Add to wishlist'}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Truck className="h-4 w-4 text-amber-600" />
                Delivery
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                Shipping fee is calculated at checkout from your selected region and town.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <CreditCard className="h-4 w-4 text-amber-600" />
                Secure payment
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                Pay securely online with card or mobile money through Paystack.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                Checked item
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                Products are reviewed before dispatch for accurate condition and quality.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                Support
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                Contact support with your order code if you need help after purchase.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl border-gray-300 font-semibold transition hover:border-amber-600 hover:bg-slate-50 hover:text-amber-700"
              onClick={() => {
                setLightboxIndex(activeIndex);
                setOpenLightbox(true);
              }}
            >
              View Photos
            </Button>

            <a href={chatLink} target="_blank" rel="noopener noreferrer">
              <Button
                className="h-11 w-full rounded-xl bg-green-600 font-semibold text-white transition hover:bg-green-700"
                disabled={!WHATSAPP_NUMBER}
              >
                <FaWhatsapp className="mr-2 text-lg" />
                Ask a Question
              </Button>
            </a>
          </div>

          {!WHATSAPP_NUMBER && (
            <p className="mt-2 text-xs text-red-600">
              Set NEXT_PUBLIC_WHATSAPP_NUMBER in your .env to enable Chat.
            </p>
          )}

          <div className="mt-7">
            <h2 className="text-sm font-bold text-gray-900">Specifications</h2>

            <div className="mt-3 rounded-xl bg-slate-50 p-4 ring-1 ring-black/5">
              {specLines.length ? (
                <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  {specLines.map((line, i) => (
                    <li key={i} className="flex gap-2 leading-5">
                      <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">No specifications provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-950">Related products</h2>
              <p className="mt-1 text-sm text-gray-600">More products from {brand}.</p>
            </div>
            <Link href="/shop" className="text-sm font-semibold text-amber-700 hover:text-amber-800">
              View shop
            </Link>
          </div>
          <div className="grid auto-cols-[calc((100%_-_1rem)_/_2)] grid-flow-col gap-4 overflow-x-auto pb-3 lg:auto-cols-[calc((100%_-_4rem)_/_5)]">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="reviews" className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-950">Customer reviews</h2>
          <p className="mt-1 text-sm text-gray-600">
            Reviews are available only to customers who purchased this product.
          </p>
        </div>
        <ReviewForm productId={product.id} />
      </section>

      {/* Lightbox */}
      <Dialog open={openLightbox} onOpenChange={setOpenLightbox}>
        <DialogContent
          className="p-0 max-w-[95vw] sm:max-w-[92vw] md:max-w-[900px] lg:max-h-[86vh] overflow-hidden"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Product Images</DialogTitle>
          </DialogHeader>

          <DialogClose asChild>
            <button
              className="absolute right-3 top-3 z-50 rounded-full bg-white/80 p-2 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogClose>

          <div className="relative mx-auto aspect-[16/10] w-full bg-black">
            <ZoomableLightboxImage
              src={gallery[lightboxIndex] || '/placeholder.jpg'}
              alt={`Image ${lightboxIndex + 1}`}
            />

            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setLightboxIndex((i) => (i + 1) % gallery.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto bg-white px-3 py-3">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setLightboxIndex(i)}
                  className={[
                    'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1',
                    i === lightboxIndex ? 'ring-amber-600' : 'ring-black/10 hover:ring-amber-300',
                  ].join(' ')}
                  aria-label={`Show image ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt={`Thumb ${i + 1}`}
                    fill
                    sizes="56px"
                    className="object-contain bg-slate-50"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
