'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/currencyformat';

type Img = { id?: number; image: string; is_primary?: boolean };
type Product = {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  discount_price?: number | string | null;
  images?: Img[];
  main_image?: string | null;
  main_image_url?: string | null;
  is_in_stock?: boolean;
  stock_quantity?: number;
};

const toNum = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^\d]/g, '');

function normalizeUrl(u?: string | null) {
  if (!u) return undefined;
  return u.startsWith('http://') ? u.replace(/^http:\/\//, 'https://') : u;
}

export default function ProductCardCol({
  product,
}: {
  product: Product;
}) {
  const img =
    normalizeUrl(product.main_image_url) ||
    normalizeUrl(product.main_image) ||
    normalizeUrl(product.images?.[0]?.image) ||
    '/placeholder.jpg';

  const price = toNum(product.price);
  const d = product.discount_price == null ? NaN : toNum(product.discount_price);
  const hasDiscount = Number.isFinite(d) && d > 0 && d < price;
  const percent = hasDiscount && price > 0 ? Math.round(((price - d) / price) * 100) : 0;

  const finalPrice = hasDiscount ? d : price;

  const chatLink = useMemo(() => {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : '';
    const url = base ? `${base}/product/${product.slug || product.id}` : '';
    const msg = `Hello, I'm interested in:\n${product.name}\nPrice: ${formatGHS(finalPrice)}\n${url}`;
    return WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
      : '#';
  }, [product.id, product.slug, product.name, finalPrice]);

  const href = `/product/${product.slug || product.id}`;

  return (
    <div className="group rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
      {/* Whole top area is clickable */}
      <Link
        href={href}
        className="grid grid-cols-[96px_1fr] gap-3 p-3 sm:grid-cols-[120px_1fr] sm:p-4"
        aria-label={`View ${product.name}`}
      >
        <div className="relative overflow-hidden rounded-xl bg-slate-50 ring-1 ring-black/5">
          <div className="relative h-[86px] w-[86px] sm:h-[110px] sm:w-[110px]">
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 86px, 110px"
              className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </div>

          {hasDiscount && (
            <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
              {percent}% OFF
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h3
            className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-yellow-700"
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="mt-2">
            {hasDiscount ? (
              <>
                <div className="text-xs text-gray-400 line-through">
                  {formatGHS(price)}
                </div>
                <div className="mt-1 text-lg font-extrabold text-yellow-600">
                  {formatGHS(d)}
                </div>
              </>
            ) : (
              <div className="text-lg font-extrabold text-gray-900">
                {formatGHS(price)}
              </div>
            )}
          </div>

          {product.is_in_stock === false && (
            <div className="mt-2 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Out of stock
            </div>
          )}
        </div>
      </Link>

      {/* CTA row */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="grid grid-cols-2 gap-2">
          <Link href={href}>
            <Button
              variant="outline"
              className="
                h-10 w-full rounded-xl font-semibold
                border-gray-300
                hover:bg-yellow-50 hover:border-yellow-500 hover:text-yellow-700
                transition
              "
            >
              View
            </Button>
          </Link>

          <a href={chatLink} target="_blank" rel="noopener noreferrer">
            <Button
              className="
                h-10 w-full rounded-xl font-semibold
                bg-green-600 text-white hover:bg-green-700 transition
              "
              disabled={!WHATSAPP_NUMBER}
            >
              <FaWhatsapp className="mr-2 text-lg" />
              Chat Us
            </Button>
          </a>
        </div>

        {!WHATSAPP_NUMBER && (
          <p className="mt-2 text-xs text-red-600">
            Set NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local to enable Chat.
          </p>
        )}
      </div>
    </div>
  );
}
