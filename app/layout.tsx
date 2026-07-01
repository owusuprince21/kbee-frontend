import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import GlobalRouteLoader from '@/components/GlobalRouteLoader';
import AuthBootstrap from '@/components/AuthBootstrap';
import AppProviders from '@/components/AppProviders';
import { createPageMetadata, siteDescription, siteKeywords, siteName, siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  keywords: siteKeywords,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: 'technology retail',
  icons: {
    icon: [
      { url: '/logo.jpeg', type: 'image/jpeg' },
    ],
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  ...createPageMetadata({
    description: siteDescription,
    path: '/',
  }),
  title: {
    default: `${siteName} | Quality New & UK Used Laptops in Ghana`,
    template: `%s | ${siteName}`,
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-white font-sans antialiased">
        <AppProviders>
          {/* Client bootstrap: wires Firebase auth -> Zustand and refreshes tokens */}
          <AuthBootstrap />

          {/* Loader overlays everything during transitions */}
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
