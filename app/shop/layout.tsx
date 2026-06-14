import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Shop',
  description:
    'Shop quality new and UK used laptops, accessories, storage, peripherals, routers, and computer essentials from KBee Computers in Ghana.',
  path: '/shop',
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
