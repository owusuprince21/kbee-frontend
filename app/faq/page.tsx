'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  CreditCard,
  Truck,
  Package,
  ShieldCheck,
  UserCheck,
  Wrench,
  HelpCircle,
  X,
} from 'lucide-react';

type QA = { q: string; a: string; id?: string };
type Group = { name: string; items: QA[] };

const FAQS: Group[] = [
  {
    name: 'Orders & Payments',
    items: [
      {
        q: 'Which payment methods do you accept?',
        a: `We accept Mobile Money (MTN/Vodafone/AirtelTigo), bank cards via Paystack (Visa/Mastercard/Verve), and direct bank transfer for bulk or corporate orders.`,
      },
      {
        q: 'Is my payment secure?',
        a: `Yes. Card and MoMo payments are processed through certified gateways (e.g., Paystack) using industry-standard encryption. KBee Computers never stores your card or wallet PIN.`,
      },
      {
        q: 'Can I pay on delivery?',
        a: `Currently, payment-on-delivery is available for selected locations and order values. For faster processing, we recommend MoMo or card payment at checkout.`,
      },
    ],
  },
  {
    name: 'Shipping & Delivery',
    items: [
      {
        q: 'How much is shipping?',
        a: `We use a flat nationwide shipping fee of GH₵50. Express delivery and bulky items may attract a surcharge — you’ll see this clearly before checkout.`,
      },
      {
        q: 'How long will delivery take?',
        a: `Accra/Tema: 1–2 business days. Other regions: 2–5 business days depending on courier routes and your exact location. You’ll receive tracking updates after dispatch.`,
      },
      {
        q: 'Do you offer in-store pickup?',
        a: `Yes — pickup is available at our office/partner locations. Choose “Pick up” at checkout and we’ll notify you when your order is ready.`,
      },
    ],
  },
  {
    name: 'Products & Stock',
    items: [
      {
        q: 'Are products brand new and authentic?',
        a: `Yes. We sell 100% original products sourced from authorized distributors. Product pages indicate condition (Brand New, Open Box, or Refurbished) where applicable.`,
      },
      {
        q: 'An item shows “Out of Stock”. Can I pre-order?',
        a: `For popular items you can request a restock or place a pre-order. Use the “Notify me”/contact options and our team will confirm timelines before you pay.`,
      },
    ],
  },
  {
    name: 'Warranty & Returns',
    items: [
      {
        q: 'What is your warranty policy?',
        a: `Most new items come with a 1-year limited manufacturer warranty (brand-specific). Accessories and refurbished items may have different coverage. Check the product page for details.`,
      },
      {
        q: 'What is your return policy?',
        a: `7-day return window for factory defects or wrong items delivered. Items must be in original condition with all accessories and packaging. Contact support to initiate a return.`,
      },
      {
        q: 'How are repairs handled?',
        a: `Repairs are handled by brand-authorized centers or our certified partners. We’ll guide you through diagnosis, RMA, and repair timelines.`,
      },
    ],
  },
  {
    name: 'Accounts & Security',
    items: [
      {
        q: 'Do I need an account to order?',
        a: `You can browse without an account, but you’ll need one to place orders, track deliveries, save wishlists, and access invoices.`,
      },
      {
        q: 'How do you protect my data?',
        a: `We follow best practices: encrypted transport (HTTPS), limited data retention, and strict access controls. See our Privacy Policy for full details.`,
      },
    ],
  },
  {
    name: 'Services',
    items: [
      {
        q: 'Do you offer setup and installation?',
        a: `Yes — we provide laptop configuration, OS installation, data transfer, networking, and basic training packages. Ask at checkout or contact support.`,
      },
      {
        q: 'Can you supply in bulk to schools and companies?',
        a: `Absolutely. We handle bulk procurement, standardization, and after-sales support. Request a quote and we’ll share pricing and lead times.`,
      },
    ],
  },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const ICONS: Record<string, LucideIcon> = {
  'Orders & Payments': CreditCard,
  'Shipping & Delivery': Truck,
  'Products & Stock': Package,
  'Warranty & Returns': ShieldCheck,
  'Accounts & Security': UserCheck,
  Services: Wrench,
};

export default function FAQPage() {
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState<string>('All');

  // NEW: state to control a single open accordion at a time
  const [openId, setOpenId] = useState<string | null>(null);

  const cats = useMemo(() => ['All', ...FAQS.map((g) => g.name)], []);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FAQS.map((group) => {
      if (activeCat !== 'All' && group.name !== activeCat)
        return { ...group, items: [] };
      if (!needle) return group;
      const items = group.items.filter(
        (item) =>
          item.q.toLowerCase().includes(needle) ||
          item.a.toLowerCase().includes(needle)
      );
      return { ...group, items };
    }).filter((g) => g.items.length > 0);
  }, [q, activeCat]);

  // JSON-LD for SEO (top results only to keep it concise)
  const jsonLd = useMemo(() => {
    const top = FAQS.flatMap((g) => g.items.map((it) => ({ q: it.q, a: it.a }))).slice(0, 12);
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: top.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            KBee Computers — Since September 2014
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Quick answers about orders, payments, shipping, warranty, and services.
          </p>

          {/* Search */}
          <div className="mt-6">
            <label htmlFor="faq-search" className="sr-only">
              Search FAQs
            </label>
            <div className="relative">
              <input
                id="faq-search"
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search: shipping, warranty, MoMo, Paystack…"
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-amber-50 placeholder:text-slate-400 focus:border-amber-500 focus:ring-4"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  activeCat === c
                    ? 'border-amber-500 bg-amber-600 text-white'
                    : 'border-white/15 bg-white/10 text-slate-200 hover:bg-white/15'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr_360px]">
          {/* Left: sticky TOC */}
          <aside className="hidden lg:block">
            <nav
              aria-label="Categories"
              className="sticky top-24 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Browse
              </div>
              <ul className="space-y-1.5">
                {FAQS.map((g) => {
                  const Icon = ICONS[g.name] ?? HelpCircle;
                  return (
                    <li key={g.name}>
                      <a
                        href={`#${slugify(g.name)}`}
                        onClick={() => setActiveCat('All')}
                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Icon className="h-4 w-4 text-slate-400 group-hover:text-amber-600" />
                        <span>{g.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Middle: Accordions */}
          <div className="space-y-8">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-slate-600">
                No results. Try different keywords or browse categories.
              </div>
            ) : (
              filtered.map((group) => {
                const Icon = ICONS[group.name] ?? HelpCircle;
                return (
                  <div key={group.name} id={slugify(group.name)}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-50">
                        <Icon className="h-3.5 w-3.5 text-amber-700" />
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">
                        {group.name}
                      </h2>
                    </div>

                    <div className="divide-y rounded-xl border bg-white shadow-sm">
                      {group.items.map((item, idx) => {
                        const id = item.id || `${slugify(group.name)}-${idx}`;
                        const isOpen = openId === id;
                        return (
                          <details key={id} className="group" open={isOpen}>
                            <summary
                              className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 text-left text-[15px] font-medium text-slate-900 hover:bg-slate-50"
                              aria-controls={`${id}-panel`}
                              // Prevent native toggle; control with React so only one is open
                              onClick={(e) => {
                                e.preventDefault();
                                setOpenId((prev) => (prev === id ? null : id));
                              }}
                            >
                              <span className="pr-6">{item.q}</span>
                              <ChevronDown
                                aria-hidden
                                className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                              />
                            </summary>
                            <div
                              id={`${id}-panel`}
                              className="px-4 pb-4 text-sm leading-relaxed text-slate-700"
                            >
                              {item.a}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Help card / contact */}
          <aside className="space-y-6">
            <div className="rounded-xl border bg-slate-950 p-6 text-white shadow-sm">
              <h3 className="text-base font-semibold text-white">
                Can’t find your answer?
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Our team is happy to help with quotes, compatibility checks, or warranty questions.
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Contact Support
                </Link>
                <Link
                  href="/policies/returns"
                  className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Returns & Warranty Policy
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Business hours: Mon–Sat, 9:00–18:00 GMT
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Quick Links</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/shop" className="text-amber-600 hover:underline">
                    Shop All Products
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="text-amber-600 hover:underline">
                    Track Your Orders
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-amber-600 hover:underline">
                    About KBee Computers
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* SEO: FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
