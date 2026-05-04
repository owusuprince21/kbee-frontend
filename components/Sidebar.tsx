// components/CartSidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/currencyformat';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();

  // 👇 Ensures server and first client render match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const unitPrice = (price: any, discount: any) => {
    const p = Number(price) || 0;
    const d = discount != null ? Number(discount) : undefined;
    return typeof d === 'number' && !Number.isNaN(d) && d < p ? d : p;
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-96 max-w-[90vw] transform bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-xl font-bold">Your Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(100%-4.5rem)] flex-col">
          {/* Items */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {!mounted ? (
              // Render neutral skeleton on server & first client paint
              <div className="space-y-3">
                <div className="h-20 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-20 w-full animate-pulse rounded bg-gray-100" />
              </div>
            ) : items.length === 0 ? (
              <div className="grid place-items-center py-16 text-center text-gray-600">
                <p>Your cart is empty.</p>
              </div>
            ) : (
              items.map((item) => {
                const price = Number(item.product.price) || 0;
                const discount =
                  item.product.discount_price != null
                    ? Number(item.product.discount_price)
                    : undefined;
                const hasDiscount =
                  typeof discount === 'number' && !Number.isNaN(discount) && discount < price;

                const perUnit = unitPrice(price, discount);
                const lineTotal = perUnit * item.quantity;

                return (
                  <div key={item.id} className="flex gap-4 rounded-lg border p-3">
                    <Link
                      href={`/product/${item.product.slug}`}
                      onClick={onClose}
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded"
                    >
                      <Image
                        src={item.product.images?.[0]?.image || '/placeholder.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.product.slug}`}
                        onClick={onClose}
                        className="line-clamp-2 font-semibold hover:text-yellow-600"
                      >
                        {item.product.name}
                      </Link>

                      <div className="mt-1 flex items-center gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="font-bold text-yellow-600">
                              {formatGHS(discount!)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {formatGHS(price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-gray-900">
                            {formatGHS(price)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            updateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-semibold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>

                        <span className="ml-auto font-semibold">
                          {mounted ? formatGHS(lineTotal) : formatGHS(0)}
                        </span>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-700"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-5">
            <div className="mb-4 flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              {/* 👇 Same value on server & initial client paint */}
              <span className="text-yellow-600">
                {mounted ? formatGHS(getTotal()) : formatGHS(0)}
              </span>
            </div>

            <div className="flex gap-2">
              <Link href="/cart" className="flex-1" onClick={onClose}>
                <Button variant="outline" className="w-full">
                  View Cart
                </Button>
              </Link>
              <Link href="/checkout" className="flex-1" onClick={onClose}>
                <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-600">
                  Checkout
                </Button>
              </Link>
            </div>

            {mounted && items.length > 0 && (
              <Button
                variant="ghost"
                className="mt-3 w-full text-red-600 hover:bg-red-50"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
