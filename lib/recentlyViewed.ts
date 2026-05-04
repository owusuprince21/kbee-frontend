'use client';
import type { Product } from '@/lib/types';

const KEY = 'recently_viewed_products';
const MAX_ITEMS = 50;

function read(): Product[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: Product[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {}
}

export function addRecentlyViewed(product: Product) {
  if (!product?.id) return;
  const list = read().filter((p) => p?.id !== product.id);
  list.unshift(product);
  write(list);
}

export const addRecentlyViewedShallow = addRecentlyViewed;

export function getRecentlyViewed(): Product[] {
  return read();
}

export function clearRecentlyViewed() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function subscribeRecentlyViewed(cb: (items: Product[]) => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === KEY) cb(read());
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
