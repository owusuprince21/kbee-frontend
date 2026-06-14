'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import HeroCarousel from '@/components/HeroCarousel';
import PromoFlex from '@/components/PromoFlex';
import ServicesBar from '@/components/ServicesBar';
import BrowseByCategory from '@/components/BrowseCategory';
import SectionHeader from '@/components/SectionHeader';
import ProductGrid from '@/components/ProductGrid';
import HotDealBanners from '@/components/HotDealBanners';
import CountdownBanner from '@/components/CountdownBanner';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import HotDeal from '@/components/HotDeal';

import type { Product } from '@/lib/types';
import { listProducts } from '@/lib/api/products';
import { listCategories, type Category as ApiCategory } from '@/lib/api/categories';
import { http } from '@/lib/api/http';
import { listHotItems, type HotItemAPI } from '@/lib/api/hotItems';

type ReviewApi = {
  id: number;
  rating: number | string;
  comment?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  product?: number | string | { id?: number | string; slug?: string | null; name?: string | null } | null;
  product_name?: string | null;
  product_slug?: string | null;
  product_image?: string | null;
  customer?: { id?: number | string; full_name?: string | null; email?: string | null; photo_url?: string | null; firebase_uid?: string | null } | null;
};

type TestimonialItem = {
  id?: number;
  comment: string;
  rating: number;
  full_name?: string | null;
  photo_url?: string | null;
  customer?: { full_name?: string | null; photo_url?: string | null } | null;
  product?: ReviewApi['product'];
  product_name?: string | null;
  product_slug?: string | null;
  product_image?: string | null;
};

const REVIEWS_ENDPOINT = '/api/reviews/?page_size=8&ordering=-created_at';

const toNum = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const safeUrl = (u?: string | null) =>
  u ? (u.startsWith('http://') ? u.replace(/^http:\/\//, 'https://') : u) : undefined;

export default function Home() {
  const [heroProducts, setHeroProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals]   = useState<Product[]>([]);
  const [bestSelling, setBestSelling]   = useState<Product[]>([]);
  const [categories, setCategories]     = useState<ApiCategory[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [hotItems, setHotItems]         = useState<HotItemAPI[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [
          heroRes,
          arrivalsRes,
          bestRes,
          catsRes,
          reviewsRes,
          hotItemsRes,
        ] = await Promise.all([
          listProducts({ page_size: 8,  ordering: '-updated_at' }),
          listProducts({ page_size: 12, ordering: '-created_at', ...( { is_new_arrival: true } as any) }),
          listProducts({ page_size: 12, ...( { is_best_seller: true } as any) }),
          listCategories(),
          http<any>(REVIEWS_ENDPOINT).catch(() => ({ results: [] })),
          listHotItems('active'),
        ]);

        if (cancelled) return;

        // products
        const heroList = heroRes.results ?? (heroRes as any as Product[]) ?? [];
        setHeroProducts(heroList);

        const arrivalsList = arrivalsRes.results?.length ? arrivalsRes.results : heroList;
        setNewArrivals(arrivalsList.slice(0, 12));

        const bestList = bestRes.results?.length ? bestRes.results : heroList;
        setBestSelling(bestList.slice(0, 12));

        // categories
        setCategories(Array.isArray(catsRes) ? catsRes : []);

        // testimonials
        const reviews: ReviewApi[] = (reviewsRes?.results ?? reviewsRes ?? []) as ReviewApi[];
        const seenReviews = new Set<string>();
        setTestimonials(
          reviews
            .filter((r) => {
              const key = r.id ? `id:${r.id}` : `${r.customer_name || r.customer?.full_name || ''}:${r.comment || ''}`;
              if (seenReviews.has(key)) return false;
              seenReviews.add(key);
              return true;
            })
            .map((r) => ({
              id: r.id,
              comment: String(r.comment ?? ''),
              rating: Number(r.rating) || 0,
              customer: r.customer ?? null,
              full_name: r.customer?.full_name ?? r.customer_name ?? null,
              photo_url: r.customer?.photo_url ?? null,
              product: r.product ?? null,
              product_name: r.product_name ?? null,
              product_slug: r.product_slug ?? null,
              product_image: r.product_image ?? null,
            }))
        );

        // hot items
        const cleaned = Array.isArray(hotItemsRes) ? hotItemsRes.filter(h => h.is_running !== false) : [];
        setHotItems(cleaned);

        if (process.env.NODE_ENV !== 'production') {
          // helpful dev log
          // eslint-disable-next-line no-console
          console.debug('[hotItems]', cleaned);
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load homepage data.');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <main>
      <HeroCarousel products={heroProducts} />
      <PromoFlex />
      <ServicesBar />

      {/* Countdown self-fetches & ticks */}
      <CountdownBanner />

      <BrowseByCategory
        categories={categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          image: c.image ?? null,
        }))}
      />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="New Arrivals"
            ctaLabel="View All Products"
            href="/shop?sort=newest"
          />
          <ProductGrid products={newArrivals} />
        </div>
      </section>



      {/* Optional static promo banners you already had */}
      <HotDealBanners categories={categories} />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Best Selling"
            ctaLabel="View All"
            href="/shop?is_best_seller=true"
          />
          <ProductGrid products={bestSelling} />
        </div>
      </section>

      {/* Render all active HotItems */}
      {hotItems.map((h) => {
        const title =
          h.title ||
          h.category_name ||
          'Hot Deal';

        const productTitle =
          h.product_title ||
          h.product_name ||
          'Featured Product';

        const specs =
          (h.specs && h.specs.trim()) ||
          (h.product_description ? String(h.product_description).slice(0, 120) + '…' : '');

        // Use the fields provided by your serializer
        const price = toNum(h.price) ?? 0;
        const compareAt = toNum(h.compare_at_price);

        const image = safeUrl(h.image_url) || safeUrl(h.main_image_url) || '/placeholder.png';
        const href = h.cta_href || (h.product_slug ? `/product/${h.product_slug}` : '/shop');

        return (
          <HotDeal
            key={h.id}
            title={title}
            productTitle={productTitle}
            specs={specs}
            price={price}
            compareAt={compareAt}
            image={image!}
            href={href}
            ctaText={h.cta_text || 'Shop Now'}
          />
        );
      })}

      <Testimonials items={testimonials as any} />
      <Newsletter />
    </main>
  );
}
