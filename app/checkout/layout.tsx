import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Checkout',
  description: 'Complete your KBee Computers checkout securely with card or mobile money.',
  path: '/checkout',
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
