'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/currencyformat';
import { addRecentlyViewedShallow } from '@/lib/recentlyViewed';
import { useAddToCartMutation, useAddToWishlistMutation } from '@/lib/api/commerce';
import { ApiError } from '@/lib/api/http';

interface ProductCardProps {
  product: Product & {
    main_image?: string | null;
    main_image_url?: string | null;
    images?: { image?: string | null }[];
  };
}

function getCover(product: ProductCardProps['product']) {
  return (
    product.main_image_url ||
    product.main_image ||
    product.images?.[0]?.image ||
    '/placeholder.jpg'
  );
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

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCartMutation();
  const addToWishlist = useAddToWishlistMutation();
  const slugOrId = product.slug || String(product.id);
  const href = `/product/${slugOrId}`;
  const inStock =
    product.is_in_stock ??
    (typeof product.stock_quantity === 'number' ? product.stock_quantity > 0 : true);

  const price = Number(product.price) || 0;
  const discount =
    product.discount_price != null ? Number(product.discount_price) : null;
  const hasDiscount = discount !== null && discount < price;

  const discountPercent = hasDiscount
    ? Math.round(((price - discount!) / price) * 100)
    : 0;

  const finalPrice = hasDiscount ? discount! : price;

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

          {!inStock ? (
            <span className="absolute left-3 top-3 rounded-full bg-gray-950 px-3 py-1 text-xs font-bold text-white">
              Out of Stock
            </span>
          ) : hasDiscount ? (
            <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
              {discountPercent}% OFF
            </span>
          ) : null}
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

          <Button
            className="h-9 w-full rounded-xl bg-yellow-500 font-semibold text-black transition hover:bg-yellow-600"
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
            {inStock ? 'Add' : 'Sold'}
          </Button>
        </div>
        <Button
          variant="ghost"
          className="mt-2 h-8 w-full rounded-xl text-xs text-gray-600 hover:text-red-600"
          disabled={!inStock || addToWishlist.isPending}
          onClick={async () => {
            if (!inStock) return;
            try {
              await addToWishlist.mutateAsync(product.id);
              toast.success('Saved to wishlist.');
            } catch (err) {
              toast.error(getApiMessage(err, 'Could not save item.'));
            }
          }}
        >
          <Heart className="mr-2 h-4 w-4" />
          {inStock ? 'Wishlist' : 'Unavailable'}
        </Button>
      </div>
    </div>
  );
}
