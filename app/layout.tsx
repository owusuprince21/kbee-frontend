import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import GlobalRouteLoader from '@/components/GlobalRouteLoader';
import AuthBootstrap from '@/components/AuthBootstrap';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kbee Computers - Quality UK Used & New Laptops',
  description:
    'Shop quality UK used and new laptops, laptop chargers, WiFi routers, and external drives at competitive prices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-dvh bg-white antialiased`}>
        {/* Client bootstrap: wires Firebase auth → Zustand and refreshes tokens */}
        <AuthBootstrap />

        {/* Loader overlays everything during transitions */}
        <GlobalRouteLoader />

        <Navbar />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
