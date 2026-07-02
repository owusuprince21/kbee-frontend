import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import './globals.css';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import GlobalRouteLoader from '@/components/GlobalRouteLoader';
import AuthBootstrap from '@/components/AuthBootstrap';
import AppProviders from '@/components/AppProviders';

import {
  absoluteUrl,
  defaultOgImage,
  siteDescription,
  siteKeywords,
  siteName,
  siteUrl,
} from '@/lib/seo';

const defaultTitle = `${siteName} | Quality New & UK Used Laptops in Ghana`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: siteName,
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,

  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: 'technology retail',

  alternates: {
    canonical: siteUrl,
  },

  icons: {
    icon: [{ url: '/logo.jpeg', type: 'image/jpeg' }],
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },

  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: siteUrl,
    siteName,
    title: defaultTitle,
    description: siteDescription,
    images: [
      {
        url: absoluteUrl(defaultOgImage),
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: siteDescription,
    images: [absoluteUrl(defaultOgImage)],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-white font-sans antialiased">
        <AppProviders>
          <AuthBootstrap />

          <Suspense fallback={null}>
            <GlobalRouteLoader />
          </Suspense>

          <Navbar />
          {children}
          <Footer />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}