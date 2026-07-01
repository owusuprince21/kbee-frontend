import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

type ProductLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

function normalizeImage(value?: string | null) {
  if (!value) return undefined;
  return value.startsWith('http://') ? value.replace(/^http:\/\//, 'https://') : value;
}

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug || '');
  const product = slug ? await fetchProduct(slug) : null;

  if (!product) {
    return createPageMetadata({
      title: 'Product',
      description: 'View quality products from KBee Computers Ghana.',
      path: slug ? `/product/${slug}` : '/shop',
    });
  }

  const primaryImage =
    product?.images?.find((image: any) => image?.is_primary)?.image || product?.images?.[0]?.image;
  const categoryName = product?.category?.name ? ` in ${product.category.name}` : '';
  const stockText = product?.is_in_stock ? 'Available now' : 'Currently out of stock';

  return createPageMetadata({
    title: product.name,
    description:
      product?.description ||
      `${stockText}: shop ${product.name}${categoryName} at KBee Computers Ghana with reliable support and delivery.`,
    path: `/product/${slug}`,
    image: normalizeImage(primaryImage),
    type: 'article',
  });
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return children;
}
