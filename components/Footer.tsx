'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6';
import { listCategories, type Category } from '@/lib/api/categories';

function labelFromCategory(category: Category) {
  const value = category.name || category.slug;
  return String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

const socialLinks = [
  { label: 'Facebook', href: '#', icon: FaFacebookF },
  { label: 'Instagram', href: '#', icon: FaInstagram },
  { label: 'TikTok', href: '#', icon: FaTiktok },
  { label: 'WhatsApp', href: 'https://wa.me/233248147215', icon: FaWhatsapp },
];

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await listCategories();
      if (!cancelled) setCategories(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Kbee Computers</h3>
            <p className="text-gray-400 mb-4">
              Your trusted source for quality UK used and new laptops, accessories, and computer equipment.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-amber-500 hover:text-amber-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-slate-500 transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-slate-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-slate-500 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-slate-500 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="text-gray-400 hover:text-slate-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="text-gray-400 hover:text-slate-500 transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`} className="text-gray-400 hover:text-slate-500 transition-colors">
                    {labelFromCategory(category)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <span>Accra Kingsway Building, Shop No. 99, Ghana</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>+233 24 814 7215</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>info@kbeecomputers.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Kbee Computers | All rights reserved | Developed by{' '}
            <a
              href="https://owusu-portfolio-site.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-500 transition-colors hover:text-amber-500"
            >
              Prince Owusu
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
