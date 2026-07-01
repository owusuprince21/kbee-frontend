'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Home,
  ShoppingBag,
  Phone,
  MessageCircle,
  ShoppingCart,
  Heart,
  User,
  LogIn,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

interface MenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^\d]/g, '');

function waLink(message: string) {
  if (!WHATSAPP_NUMBER) return '#';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const primaryItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Shop', href: '/shop', icon: ShoppingBag },
  { name: 'Cart', href: '/cart', icon: ShoppingCart },
  { name: 'Wishlist', href: '/wishlist', icon: Heart },
  { name: 'Contact Us', href: '/contact', icon: Phone },
];

export default function MenuSidebar({ isOpen, onClose }: MenuSidebarProps) {
  const { user } = useAuthStore();
  const chatHref = waLink('Hello, I want to ask about your products.');
  const customerName = user?.displayName || user?.email || 'Customer';

  const accountItems = user
    ? [
        { name: 'Account', href: '/profile', icon: User },
        { name: 'My Orders', href: '/orders', icon: PackageCheck },
      ]
    : [{ name: 'Sign in', href: '/signin', icon: LogIn }];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] transform bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <Link href="/" onClick={onClose} className="flex min-w-0 items-center gap-3">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-500/30">
                  <Image src="/logo.jpeg" alt="Kbee Computers logo" fill sizes="40px" className="object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-gray-950">Kbee Computers</span>
                  <span className="block truncate text-xs text-gray-500">
                    {user ? customerName : 'Shop laptops and accessories'}
                  </span>
                </span>
              </Link>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-1">
              {primaryItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className="group flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-slate-50 hover:text-amber-800"
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-amber-700" />
                    {item.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-amber-700" />
                </Link>
              ))}
            </div>

            <div className="mt-6 border-t pt-5">
              <div className="px-3 text-xs font-semibold uppercase text-gray-400">Customer</div>
              <div className="mt-2 space-y-1">
                {accountItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                    className="group flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
              >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-900" />
                      {item.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-600" />
              </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* WhatsApp CTA */}
          <div className="border-t p-4">
            <a
              href={chatHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
            >
              <Button className="h-11 w-full bg-green-600 text-white hover:bg-green-700">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat with Us
              </Button>
            </a>
            <p className="mt-3 text-center text-xs text-gray-500">Secure online checkout available.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
