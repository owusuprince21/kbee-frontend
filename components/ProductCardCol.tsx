'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/currencyformat';
import { useAddToCartMutation } from '@/lib/api/commerce';
import { ApiError } from '@/lib/api/http';

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
  brand?: string | null;
  brand_display?: string | null;
  condition?: string | null;
  category?: { name?: string | null } | null;
};

const toNum = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function normalizeUrl(u?: string | null) {
  if (!u) return undefined;
  return u.startsWith('http://') ? u.replace(/^http:\/\//, 'https://') : u;
}

function getApiMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    const data = err.data || {};
    return (
      data.detail ||
      data.product?.[0] ||
      data.product_id?.[0] ||
      data.quantity?.[0] ||
      data.non_field_errors?.[0] ||
      fallback
    );
  }
  return fallback;
}

export default function ProductCardCol({
  product,
}: {
  product: Product;
}) {
  const addToCart = useAddToCartMutation();
  const img =
    normalizeUrl(product.main_image_url) ||
    normalizeUrl(product.main_image) ||
    normalizeUrl(product.images?.[0]?.image) ||
    '/placeholder.jpg';

  const price = toNum(product.price);
  const d = product.discount_price == null ? NaN : toNum(product.discount_price);
  const hasDiscount = Number.isFinite(d) && d > 0 && d < price;
  const percent = hasDiscount && price > 0 ? Math.round(((price - d) / price) * 100) : 0;
  const inStock =
    product.is_in_stock ??
    (typeof product.stock_quantity === 'number' ? product.stock_quantity > 0 : true);

  const finalPrice = hasDiscount ? d : price;
  const href = `/product/${product.slug || product.id}`;
  const stockQty = toNum(product.stock_quantity);
  const brand = product.brand_display || product.brand;
  const category = product.category?.name;

  return (
    <div className="group overflow-hidden rounded-xl border bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="grid grid-cols-[112px_1fr] gap-3 p-3 sm:grid-cols-[156px_1fr] sm:gap-5 sm:p-4">
        <Link
          href={href}
          className="relative overflow-hidden rounded-lg bg-slate-50 ring-1 ring-black/5"
          aria-label={`View ${product.name}`}
        >
          <div className="relative h-[112px] w-[112px] sm:h-[156px] sm:w-[156px]">
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 112px, 156px"
              className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </div>

          {!inStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-gray-950 px-2 py-1 text-[10px] font-bold text-white">
              Out
            </span>
          ) : hasDiscount ? (
            <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
              {percent}% OFF
            </span>
          ) : null}
        </Link>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap gap-2">
            {category ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                {category}
              </span>
            ) : null}
            {brand ? (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                {brand}
              </span>
            ) : null}
            {product.condition ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                {product.condition}
              </span>
            ) : null}
          </div>

          <Link href={href}>
            <h3
              className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-gray-950 transition group-hover:text-amber-700 sm:text-base"
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>

          <div className="mt-2">
            {hasDiscount ? (
              <>
                <div className="text-xs text-gray-400 line-through">
                  {formatGHS(price)}
                </div>
                <div className="mt-1 text-lg font-extrabold text-amber-600">
                  {formatGHS(d)}
                </div>
              </>
            ) : (
              <div className="text-lg font-extrabold text-gray-900">
                {formatGHS(price)}
              </div>
            )}
          </div>

          {!inStock && (
            <div className="mt-2 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Out of stock
            </div>
          )}

          {inStock && stockQty > 0 ? (
            <p className="mt-2 text-xs font-medium text-gray-500">{stockQty} in stock</p>
          ) : null}

          <div className="mt-auto grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
            <Link href={href}>
              <Button
                variant="outline"
                className="h-10 w-full rounded-lg border-gray-300 font-semibold transition hover:border-amber-600 hover:bg-slate-50 hover:text-amber-700"
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
            </Link>

            <Button
              className="h-10 w-full rounded-lg bg-amber-600 font-semibold text-white transition hover:bg-amber-700"
              disabled={!inStock || addToCart.isPending}
              onClick={async () => {
                if (!inStock) return;
                try {
                  await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
                  toast.success('Added to cart.');
                } catch (err) {
                  toast.error(getApiMessage(err, 'Could not add to cart.'));
                }
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inStock ? 'Add to Cart' : 'Sold Out'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
