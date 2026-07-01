import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Profile',
  description: 'Manage your KBee Computers customer profile, addresses, and account details.',
  path: '/profile',
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
