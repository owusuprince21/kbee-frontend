'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, getTotal } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Button onClick={onClose} asChild>
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                  <Link href={`/product/${item.product.slug}`} onClick={onClose}>
                    <Image
                      src={item.product.images[0]?.image || '/placeholder.jpg'}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="rounded object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      href={`/product/${item.product.slug}`}
                      onClick={onClose}
                      className="font-medium hover:text-yellow-600 line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      Qty: {item.quantity}
                    </p>
                    <p className="font-bold mt-2">
                      £{((item.product.discount_price || item.product.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-6 space-y-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Subtotal:</span>
              <span>£{getTotal().toFixed(2)}</span>
            </div>
            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" asChild>
              <Link href="/cart" onClick={onClose}>
                View Cart
              </Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/checkout" onClick={onClose}>
                Checkout
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
