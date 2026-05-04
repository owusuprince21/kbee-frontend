'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaWhatsapp } from 'react-icons/fa';

import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/currencyformat';
import { addRecentlyViewedShallow } from '@/lib/recentlyViewed';

interface ProductCardProps {
  product: Product & {
    main_image?: string | null;
    main_image_url?: string | null;
    images?: { image?: string | null }[];
  };
}

const WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^\d]/g, '');

function getCover(product: ProductCardProps['product']) {
  return (
    product.main_image_url ||
    product.main_image ||
    product.images?.[0]?.image ||
    '/placeholder.jpg'
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const slugOrId = product.slug || String(product.id);
  const href = `/product/${slugOrId}`;

  const price = Number(product.price) || 0;
  const discount =
    product.discount_price != null ? Number(product.discount_price) : null;
  const hasDiscount = discount !== null && discount < price;

  const discountPercent = hasDiscount
    ? Math.round(((price - discount!) / price) * 100)
    : 0;

  const finalPrice = hasDiscount ? discount! : price;

  const chatLink = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Hello Kbee Computers, I'm interested in:\n${product.name}\nPrice: ${formatGHS(
          finalPrice
        )}\n${typeof window !== 'undefined' ? window.location.origin + href : ''}`
      )}`
    : '#';

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-lg">
      {/* Clickable product area */}
      <Link
        href={href}
        onClick={() => addRecentlyViewedShallow(product)}
        className="block"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-slate-50">
          <Image
            src={getCover(product)}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 20vw"
          />

          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-yellow-600">
            {product.name}
          </h3>

          <div className="mt-2">
            {hasDiscount ? (
              <>
                <span className="block text-xs text-gray-400 line-through">
                  {formatGHS(price)}
                </span>
                <span className="text-lg font-bold text-yellow-600">
                  {formatGHS(discount!)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {formatGHS(price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="mt-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* View button */}
          <Link href={href}>
            <Button
              variant="outline"
              className="
                h-9 w-full rounded-xl font-semibold
                border-gray-300
                hover:bg-yellow-50
                hover:border-yellow-500
                hover:text-yellow-700
                transition
              "
            >
              View
            </Button>
          </Link>

          {/* WhatsApp button */}
          <a
            href={chatLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              className="
                h-9 w-full rounded-xl
                bg-green-600 text-white font-semibold
                hover:bg-green-700
                transition
              "
              disabled={!WHATSAPP_NUMBER}
            >
              <FaWhatsapp className="mr-2 text-lg" />
              Chat Us
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
