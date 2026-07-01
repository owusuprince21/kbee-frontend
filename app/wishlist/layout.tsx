import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Wishlist',
  description: 'View saved KBee Computers products and add them to your cart.',
  path: '/wishlist',
});

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
