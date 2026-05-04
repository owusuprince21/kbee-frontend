'use client';

import { http } from './http';
import type { HeroItem } from './types';

export async function getHeroProducts() {
  return await http<HeroItem[]>(`/api/hero/`);
}
