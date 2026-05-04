// lib/api/countdown.ts
'use client';
import { http } from './http';
import type { CountdownDeal } from './types';

export async function getActiveCountdown() {
  const list = await http<CountdownDeal[]>(`/api/countdown/active/`);
  return Array.isArray(list) && list.length ? list[0] : null;
}
