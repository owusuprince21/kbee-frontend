'use client';

import { http, type Paginated } from './http';

export type ShippingRegion = {
  id: number;
  name: string;
  slug: string;
  position: number;
  active: boolean;
};

export type ShippingTown = {
  id: number;
  region: ShippingRegion;
  name: string;
  slug: string;
  fee: string;
  active: boolean;
};

export type ShippingQuote = {
  town: ShippingTown;
  subtotal: string;
  shipping_fee: string;
  charge_percent: string;
  payment_charge: string;
  total: string;
};

function unwrap<T>(data: T[] | Paginated<T>) {
  return Array.isArray((data as Paginated<T>)?.results)
    ? (data as Paginated<T>).results
    : (data as T[]);
}

export async function listShippingRegions() {
  try {
    const data = await http<ShippingRegion[] | Paginated<ShippingRegion>>('/api/shipping/regions/');
    return unwrap(data);
  } catch {
    return [];
  }
}

export async function listShippingTowns(regionSlug: string) {
  if (!regionSlug) return [];
  try {
    const data = await http<ShippingTown[] | Paginated<ShippingTown>>(
      `/api/shipping/towns/?region=${encodeURIComponent(regionSlug)}`
    );
    return unwrap(data);
  } catch {
    return [];
  }
}

export async function getShippingQuote(townId: number | string, base: number) {
  return http<ShippingQuote>(
    `/api/shipping/towns/quote/?town_id=${encodeURIComponent(String(townId))}&base=${encodeURIComponent(String(base))}`
  );
}
