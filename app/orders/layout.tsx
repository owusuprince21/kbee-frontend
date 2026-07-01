import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Orders',
  description: 'Track KBee Computers orders, receipts, and delivery progress.',
  path: '/orders',
});

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
