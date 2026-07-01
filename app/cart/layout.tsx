import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Cart',
  description: 'Review your KBee Computers cart before checkout.',
  path: '/cart',
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
