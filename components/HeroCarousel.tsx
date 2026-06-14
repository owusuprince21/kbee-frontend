'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { formatGHS } from '@/lib/currencyformat';

interface HeroCarouselProps {
  products: Product[];
}

function normalizeUrl(u?: string | null) {
  if (!u) return '';
  return u.startsWith('http://') ? u.replace(/^http:\/\//, 'https://') : u;
}

function isHeroItem(p: Product) {
  const h = p as any;
  return Boolean(h?.is_hero || h?.hero || h?.show_in_hero || h?.is_featured || h?.featured);
}

export default function HeroCarousel({ products }: HeroCarouselProps) {
  const slides = useMemo(() => {
    const flagged = (products || []).filter(isHeroItem);
    return flagged.length ? flagged : (products || []);
  }, [products]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) return;
    const id = setInterval(() => setCurrentIndex((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;

  const goToPrevious = () => setCurrentIndex((p) => (p - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrentIndex((p) => (p + 1) % slides.length);

  const product = slides[currentIndex];

  const price = Number(product.price) || 0;
  const discount = product.discount_price != null ? Number(product.discount_price) : undefined;
  const hasDiscount = typeof discount === 'number' && !Number.isNaN(discount) && discount < price;
  const percent = hasDiscount && price > 0 ? Math.round(((price - discount!) / price) * 100) : 0;

  const imgSrc =
    normalizeUrl((product as any).main_image) ||
    normalizeUrl(product.images?.[0]?.image) ||
    '/placeholder.jpg';

  const productHref = product?.slug ? `/product/${product.slug}` : '/shop';

  return (
    <div className="group relative h-[340px] sm:h-[380px] md:h-[500px] overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800">
      {/* Arrows (hidden on phones) */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden sm:flex items-center justify-between px-3 sm:px-6 md:px-8">
        <button
          onClick={goToPrevious}
          className="pointer-events-auto rounded-full bg-white/10 p-2 opacity-100 backdrop-blur-sm transition-all hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5 text-white sm:h-6 sm:w-6" />
        </button>
        <button
          onClick={goToNext}
          className="pointer-events-auto rounded-full bg-white/10 p-2 opacity-100 backdrop-blur-sm transition-all hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5 text-white sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Overlay content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="container mx-auto h-full px-3 sm:px-4">
          {/* 👇 2 columns at all breakpoints (keeps desktop layout on mobile) */}
          <div className="grid h-full grid-cols-2 items-center gap-3 sm:gap-5 md:gap-8">
            {/* Text (left) */}
            <div className="text-white">
              {/* TITLE: safe line-height + tiny bottom padding so 'g,y,p' tails aren't clipped */}
              <h1
                className="line-clamp-2 pb-px text-lg font-bold leading-[1.2] tracking-tight sm:text-2xl md:text-5xl md:leading-tight"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
                title={product.name}
              >
                {product.name}
              </h1>

              {/* DESCRIPTION */}
              <p
                className="mt-2 line-clamp-3 text-xs text-gray-300 sm:text-sm md:text-lg"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
                title={product.description || ''}
              >
                {product.description}
              </p>

              {/* Price block */}
              <div className="mt-2 sm:mt-3 flex flex-col items-start gap-1">
                {hasDiscount ? (
                  <>
                    <span className="text-xs text-gray-300 line-through sm:text-sm md:text-lg">
                      {formatGHS(price)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-yellow-400 sm:text-2xl md:text-4xl">
                        {formatGHS(discount!)}
                      </span>
                      {percent > 0 && (
                        <span className="hidden rounded bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-700 md:inline-flex">
                          {percent}% OFF
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-xl font-bold text-yellow-400 sm:text-2xl md:text-4xl">
                    {formatGHS(price)}
                  </span>
                )}
              </div>

              <Button
                asChild
                className="mt-3 h-9 px-4 text-xs bg-yellow-500 text-black hover:bg-yellow-600 sm:mt-4 sm:h-10 sm:px-6 sm:text-sm md:mt-6 md:h-12 md:px-8 md:text-lg"
              >
                <Link href={productHref} prefetch>
                  Shop Now
                </Link>
              </Button>
            </div>

            {/* Image (right) */}
            <div className="relative h-56 sm:h-72 md:h-[430px]">
              <div className="absolute -inset-x-6 inset-y-0 sm:-inset-x-8 md:-inset-x-12">
                <Image
                  src={imgSrc}
                  alt={product.name}
                  fill
                  priority
                  className="scale-125 object-contain drop-shadow-2xl sm:scale-125 md:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 sm:bottom-5 md:bottom-8 left-1/2 z-30 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 w-1.5 rounded-full transition-all ${
              index === currentIndex ? 'w-5 bg-yellow-500' : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
