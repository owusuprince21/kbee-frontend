'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Send,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const SHOP_ADDRESS = 'Accra Kingsway Building, Shop No. 99, Ghana';
const MAP_QUERY = 'KBee Computers Accra Kingsway Building Shop No. 99 Ghana';
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=16&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;
const SOCIAL_LINKS = [
  { label: 'Facebook', href: '#', icon: FaFacebookF },
  { label: 'Instagram', href: '#', icon: FaInstagram },
  { label: 'TikTok', href: '#', icon: FaTiktok },
  { label: 'WhatsApp', href: 'https://wa.me/233248147215', icon: FaWhatsapp },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // TODO: POST to your backend, e.g.:
    // await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(fd)) })
    setSent(true);
    e.currentTarget.reset();
  };

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: 'KBee Computers',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'GH',
        addressLocality: 'Accra',
        streetAddress: SHOP_ADDRESS,
      },
      hasMap: MAP_LINK,
      areaServed: 'Ghana',
      foundingDate: '2014-09',
    }),
    []
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      {/* Hero */}
      <section className="border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            KBee Computers — Since September 2014
          </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Contact KBee Computers</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Get product advice, stock checks, bulk quotes, warranty guidance, and order support from our Accra team.
          </p>
        </div>
          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <span>{SHOP_ADDRESS}</span>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <span>Mon-Sat, 9:00-18:00 GMT</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: Map + Details */}
        <div className="min-w-0 space-y-6">
          {/* Map */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="aspect-[4/3] w-full sm:aspect-video">
              <iframe
                title="KBee Computers map location"
                src={MAP_EMBED_SRC}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Map footer */}
            <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <div className="break-words text-sm font-semibold text-slate-900">
                    {SHOP_ADDRESS}
                  </div>
                  <div className="text-xs text-slate-500">Use the map for directions to the shop.</div>
                </div>
              </div>

              <a
                href={MAP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 sm:w-auto"
              >
                <Navigation className="h-4 w-4" />
                Get directions
              </a>
            </div>
          </div>

          {/* Contact info cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Phone className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Phone / WhatsApp</h3>
              </div>
              <p className="text-sm text-slate-600">
                Call or message us for quick assistance and stock checks.
              </p>
              <a
                href="tel:+233248147215"
                className="mt-3 inline-block break-all text-sm font-medium text-amber-700 hover:underline"
              >
                +233 24 814 7215
              </a>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Email</h3>
              </div>
              <p className="text-sm text-slate-600">Send us specs, RFQs, or support requests.</p>
              <a
                href="mailto:info@kbeecomputers.com"
                className="mt-3 inline-block break-all text-sm font-medium text-amber-700 hover:underline"
              >
                info@kbeecomputers.com
              </a>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Hours</h3>
              </div>
              <p className="text-sm text-slate-600">
                Mon–Sat: 9:00–18:00 GMT <br /> Sun &amp; holidays: Closed
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Social</h3>
              </div>
              <p className="text-sm text-slate-600">Find us on Facebook, Instagram, TikTok, and WhatsApp.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    aria-label={label}
                    title={label}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-amber-700 transition-colors hover:border-amber-500 hover:bg-amber-50"
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact form */}
        <div className="min-w-0 rounded-xl border bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Messages are reviewed during business hours. For urgent stock checks, call or WhatsApp us directly.</p>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Send us a message</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tell us what you need — we’ll reply with availability and best pricing.
          </p>

          {sent ? (
            <div
              className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
              role="status"
              aria-live="polite"
            >
              Thanks! Your message has been received. We’ll get back to you soon.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            {/* Honeypot */}
            <input type="text" name="company" autoComplete="off" tabIndex={-1} className="hidden" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="name" className="mb-1 block text-xs font-medium text-slate-700">
                  Full name
                </label>
                <Input id="name" name="name" autoComplete="name" placeholder="Your name" required />
              </div>
              <div className="min-w-0">
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-700">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="phone" className="mb-1 block text-xs font-medium text-slate-700">
                  Phone (optional)
                </label>
                <Input id="phone" name="phone" autoComplete="tel" placeholder="+233…" />
              </div>
              <div className="min-w-0">
                <label htmlFor="subject" className="mb-1 block text-xs font-medium text-slate-700">
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Product inquiry, bulk order, repair…"
                  required
                />
              </div>
            </div>

            <div className="min-w-0">
              <label htmlFor="message" className="mb-1 block text-xs font-medium text-slate-700">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="How can we help?"
                className="min-h-[120px]"
                required
              />
            </div>

            <Button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 bg-amber-600 text-white hover:bg-amber-700 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              Send message
            </Button>

            <p className="text-xs text-slate-500">
              By submitting, you agree to our{' '}
              <Link href="/policies/privacy" className="text-amber-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </div>
      </section>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
