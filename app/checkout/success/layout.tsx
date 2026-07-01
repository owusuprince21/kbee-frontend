import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Checkout Success',
  description: 'Your KBee Computers payment and order confirmation page.',
  path: '/checkout/success',
});

export default function CheckoutSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
