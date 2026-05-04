import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, WishlistItem } from '@/lib/types';

interface WishlistState {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  removeItemById?: (productId: number) => void; 
  clearWishlist: () => void;
  isInWishlist: (productId: number) => boolean;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => { /* ... */ },
      removeItem: (productId) => {
        set({ items: get().items.filter((it) => it.product.id !== productId) });
      },
      // alias so existing callers compile
      removeItemById: (productId) => {
        set({ items: get().items.filter((it) => it.product.id !== productId) });
      },
      clearWishlist: () => set({ items: [] }),
      isInWishlist: (productId) => get().items.some((it) => it.product.id === productId),
      getItemCount: () => get().items.length,
    }),
    { name: 'wishlist-storage' }
  )
);
