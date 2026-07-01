import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Sign In',
  description: 'Sign in to KBee Computers to sync your cart, wishlist, orders, and reviews.',
  path: '/signin',
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
