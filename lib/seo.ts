import type { Metadata } from 'next';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const siteName = 'KBee Computers';

export const siteDescription =
  'KBee Computers is a Ghana-based technology retailer and service partner for quality new and UK used laptops, desktops, storage, peripherals, accessories, warranty support, and nationwide delivery.';

export const siteKeywords = [
  'KBee Computers',
  'laptops in Ghana',
  'UK used laptops Ghana',
  'new laptops Ghana',
  'laptop accessories Ghana',
  'computer shop Accra',
  'Dell laptops Ghana',
  'HP laptops Ghana',
  'Lenovo laptops Ghana',
];

export const defaultOgImage = '/hero.png';

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function seoTitle(title?: string) {
  return title ? `${title} | ${siteName}` : `${siteName} | Quality New & UK Used Laptops in Ghana`;
}

export function createPageMetadata({
  title,
  description = siteDescription,
  path = '/',
  image = defaultOgImage,
  type = 'website',
  robots,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  robots?: Metadata['robots'];
}): Metadata {
  const fullTitle = seoTitle(title);

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type,
      locale: 'en_GH',
      siteName,
      url: absoluteUrl(path),
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    robots,
  };
}
