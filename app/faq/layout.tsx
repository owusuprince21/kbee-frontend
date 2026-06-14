import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'FAQ',
  description:
    'Find answers about KBee Computers orders, payments, delivery, warranties, returns, and product support in Ghana.',
  path: '/faq',
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
