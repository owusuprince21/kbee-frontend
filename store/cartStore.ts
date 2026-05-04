// store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/lib/types';

type CartState = {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number; // distinct line items
};

/** Price helper (prefers discount if valid) */
const unitPrice = (price: any, discount: any) => {
  const p = Number(price) || 0;
  const d = discount != null ? Number(discount) : NaN;
  return Number.isFinite(d) && d < p ? d : p;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty = 1) => {
        const q = Math.max(1, Math.floor(qty));
        const items = get().items;
        const found = items.find((it) => it.product.id === product.id);
        if (found) {
          set({
            items: items.map((it) =>
              it.product.id === product.id
                ? { ...it, quantity: it.quantity + q }
                : it
            ),
          });
        } else {
          set({
            items: [...items, { id: Date.now(), product, quantity: q }],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((it) => it.product.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        const q = Math.max(1, Math.floor(quantity)); // cap at 1 minimum
        set({
          items: get().items.map((it) =>
            it.product.id === productId ? { ...it, quantity: q } : it
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce((total, it) => {
          const per = unitPrice(it.product.price, it.product.discount_price);
          return total + per * it.quantity;
        }, 0),

      // count of distinct line items
      getItemCount: () => get().items.length,
    }),
    { name: 'cart-storage' }
  )
);

/**
 * ✅ Use this for the navbar badge.
 * Returns the *summed quantity* as a primitive number (stable for SSR).
 * DO NOT allocate arrays/objects inside selectors.
 */
export const useCartTotalQuantity = () =>
  useCartStore((s) => s.items.reduce((sum, it) => sum + it.quantity, 0));
