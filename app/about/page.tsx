// app/about/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldHalf, Headphones, Truck, Clock3, Star } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "KBee Computers is a Ghana-based technology retailer and service partner providing dependable computers, accessories and support since September 2014.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b bg-slate-950 text-white">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-50">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            Serving customers since September 2014
          </p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Practical technology, honest guidance, dependable support.
          </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              KBee Computers helps students, homes, and businesses choose, buy, and maintain the right technology reliably and affordably.
            From quality laptops and components to friendly after-sales support, we keep your work and learning moving.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
                className="inline-flex items-center rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              Shop now
            </Link>
            <Link
              href="/contact"
                className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Contact us
            </Link>
          </div>
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <Image
              src="/hero.png"
              alt="KBee Computers product showcase"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-white">2014</div>
                  <div className="text-xs text-slate-300">Founded</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Ghana</div>
                  <div className="text-xs text-slate-300">Nationwide</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Support</div>
                  <div className="text-xs text-slate-300">After sale</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section className="container mx-auto max-w-6xl px-4 pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={<Star className="h-5 w-5" />} title="Trusted since 2014" subtitle="11+ years serving Ghana" />
          <Fact icon={<ShieldHalf className="h-5 w-5" />} title="Genuine products" subtitle="Backed by warranty" />
          <Fact icon={<Headphones className="h-5 w-5" />} title="After-sales support" subtitle="Friendly, responsive help" />
          <Fact icon={<Truck className="h-5 w-5" />} title="Convenient delivery" subtitle="Nationwide options available" />
        </div>
      </section>

      {/* Our Story */}
      <section className="border-t bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-[1fr_0.85fr] md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Our story</h2>
              <p className="mt-3 text-slate-600">
                KBee Computers began in <span className="font-semibold">September 2014</span> with a simple mission: make quality
                technology accessible and dependable for everyone. Over the years we have grown from a small shop into
                a customer-first team focused on useful advice, honest pricing, and reliable support.
              </p>
              <p className="mt-3 text-slate-600">
                Today, we continue to curate a practical selection of laptops, desktops, components, and accessories—
                and we stand by every sale with setup guidance and after-sales care.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <ul className="space-y-4">
                <TimelineItem year="2014" title="KBee Computers launched">
                  Opened doors in September and started serving our first customers.
                </TimelineItem>
                <TimelineItem year="Today" title="Customer-first tech partner">
                  Expanding our catalogue and support to meet everyday learning and business needs.
                </TimelineItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="border-t bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">What we do</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Service
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Computers & accessories"
              desc="Curated laptops, desktops, storage, peripherals, and everyday essentials."
            />
            <Service
              icon={<ShieldHalf className="h-5 w-5" />}
              title="Genuine, warranted items"
              desc="We source from trusted channels and provide clear warranty information."
            />
            <Service
              icon={<Headphones className="h-5 w-5" />}
              title="Helpful after-sales support"
              desc="Setup guidance, basic troubleshooting, and friendly product advice."
            />
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="border-t">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Why customers choose KBee</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reason icon={<Clock3 className="h-5 w-5" />} title="Reliable turnaround">
              We keep things simple and timely—from order to delivery.
            </Reason>
            <Reason icon={<ShieldHalf className="h-5 w-5" />} title="Honest quality">
              Genuine products with transparent specs and warranty.
            </Reason>
            <Reason icon={<Headphones className="h-5 w-5" />} title="Human support">
              Real help when you need it—before and after purchase.
            </Reason>
            <Reason icon={<Star className="h-5 w-5" />} title="Customer-first">
              We focus on practical recommendations that fit your budget.
            </Reason>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="border-t bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="grid items-center gap-6 rounded-xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold sm:text-2xl">Need help choosing a device?</h3>
              <p className="mt-2 text-slate-300">
                Tell us how you’ll use it—school, business, or creative work—and we’ll suggest the right options.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Talk to us
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Browse products
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm text-slate-200">
              <li className="flex items-center gap-2">
                <ShieldHalf className="h-4 w-4 text-amber-600" /> Genuine items
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-600" /> Convenient delivery
              </li>
              <li className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-amber-600" /> After-sales support
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- small components ---------- */
function Fact({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mt-0.5 rounded-full bg-slate-50 p-2 text-amber-700 ring-1 ring-amber-50">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-600">{subtitle}</div>
      </div>
    </div>
  );
}

function Service({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-50">
        {icon}
        {title}
      </div>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Reason({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-center gap-2 text-slate-900">
        <span className="rounded-full bg-slate-50 p-2 text-amber-700 ring-1 ring-amber-50">{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  );
}

function TimelineItem({ year, title, children }: { year: string; title: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-6">
      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-amber-600 ring-4 ring-amber-50" />
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{year}</div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-sm text-slate-600">{children}</p>
    </li>
  );
}
