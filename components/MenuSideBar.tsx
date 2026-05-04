'use client';

import Link from 'next/link';
import { X, Home, ShoppingBag, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const menuItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Shop', href: '/shop', icon: ShoppingBag },
  { name: 'Contact Us', href: '/contact', icon: Phone },
];

export default function MenuSidebar({ isOpen, onClose }: MenuSidebarProps) {
  const chatHref = waLink('Hello, I want to ask about your products.');

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
        <div className="flex h-full flex-col p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Menu</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-100"
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* WhatsApp CTA */}
          <div className="pt-6">
            <a
              href={chatHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
            >
              <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat with Us
              </Button>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
