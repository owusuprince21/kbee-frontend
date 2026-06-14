import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import GlobalRouteLoader from '@/components/GlobalRouteLoader';
import AuthBootstrap from '@/components/AuthBootstrap';
import AppProviders from '@/components/AppProviders';
import { createPageMetadata, siteDescription, siteKeywords, siteName, siteUrl } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  keywords: siteKeywords,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: 'technology retail',
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
      <body className={`${inter.className} min-h-dvh bg-white antialiased`}>
        <AppProviders>
          {/* Client bootstrap: wires Firebase auth -> Zustand and refreshes tokens */}
          <AuthBootstrap />

          {/* Loader overlays everything during transitions */}
          <GlobalRouteLoader />

          <Navbar />
          {children}
          <Footer />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
