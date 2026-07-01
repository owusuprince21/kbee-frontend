// app/policies/privacy/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import {
  Shield,
  Database,
  Lock,
  Cookie,
  Globe2,
  UserCheck,
  FileCheck2,
  Info,
} from "lucide-react";

const LAST_UPDATED: string = new Date().toLocaleDateString('en-US', {
  timeZone: 'Africa/Accra',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});


export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how KBee Computers collects, uses, and protects your personal data when you shop with us.",
  path: "/policies/privacy",
});

export default function PrivacyPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    name: "KBee Computers Privacy Policy",
    url: "https://www.kbeecomputers.com/policies/privacy",
    dateModified: LAST_UPDATED,
    publisher: {
      "@type": "Organization",
      name: "KBee Computers",
      address: {
        "@type": "PostalAddress",
        addressCountry: "GH",
        addressLocality: "Accra",
        streetAddress: "Prudential Bank Ltd. - Kingsway Branch",
      },
    },
  };

  const toc = [
    ["overview", "Overview", Shield],
    ["data-we-collect", "Data We Collect", Database],
    ["how-we-use", "How We Use Data", FileCheck2],
    ["sharing", "Sharing & Payments", Lock],
    ["retention-security", "Retention & Security", Info],
    ["cookies", "Cookies", Cookie],
    ["rights", "Your Rights", UserCheck],
    ["intl", "International Transfers", Globe2],
    ["children", "Children’s Privacy", Shield],
    ["changes", "Changes", Info],
    ["contact", "Contact Us", FileCheck2],
  ] as const;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b bg-slate-950 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            KBee Computers
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Your privacy matters to us. This policy explains what we collect,
            why we collect it, and the choices you have.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Last updated: <span className="font-medium">{LAST_UPDATED}</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[260px_1fr]">
        {/* Desktop sticky TOC (mobile users get the chip nav below) */}
        <aside className="hidden lg:block">
          <nav
            aria-label="On this page"
            className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              On this page
            </div>
            <ul className="space-y-1.5">
              {toc.map(([href, label, Icon]) => (
                <li key={href}>
                  <a
                    href={`#${href}`}
                    className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-amber-600" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {/* Mobile chip nav */}
          <nav
            aria-label="Sections"
            className="mb-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:hidden"
          >
            {toc.map(([href, label]) => (
              <a
                key={href}
                href={`#${href}`}
                className="rounded-lg border bg-white px-3 py-2 text-center font-medium text-slate-700 hover:bg-slate-50"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Sections */}
          <div className="space-y-6 lg:space-y-8">
            {/* 1. Overview */}
            <section id="overview" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">1. Overview</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none prose-a:text-amber-600 prose-strong:text-slate-900 prose-li:marker:text-slate-500">
                  <p>
                    KBee Computers (“we”, “us”, “our”) operates a retail and online
                    store for computers and accessories. This Privacy Policy
                    applies to our website, services, and customer support channels.
                    By using our services, you agree to the practices described here.
                  </p>
                  <div className="not-prose mt-4 rounded-lg border-l-4 border-amber-300 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="leading-relaxed">
                      <strong className="text-slate-900">Summary:</strong> We collect
                      personal data to deliver your orders, provide support, improve
                      our services, and meet legal obligations. You control how we
                      use certain data—see “Your Rights” below.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Data We Collect */}
            <section id="data-we-collect" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">2. Data We Collect</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none prose-a:text-amber-600 prose-li:marker:text-slate-500">
                  <ul>
                    <li>
                      <strong>Account &amp; Identity:</strong> name, email, phone number,
                      profile details (if you create an account or sign in).
                    </li>
                    <li>
                      <strong>Order Details:</strong> shipping/billing address, items
                      purchased, delivery preferences, order notes.
                    </li>
                    <li>
                      <strong>Communications:</strong> messages you send us (email, forms,
                      chat), reviews, feedback.
                    </li>
                    <li>
                      <strong>Technical:</strong> device information, IP address, approximate
                      location, usage logs, and cookies for essential functionality
                      and analytics.
                    </li>
                    <li>
                      <strong>Payments:</strong> processed by a trusted payment provider.
                      We do <em>not</em> store full card numbers or CVV on our servers.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. How We Use Data */}
            <section id="how-we-use" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">3. How We Use Your Data</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none prose-li:marker:text-slate-500">
                  <ul>
                    <li>Provide, operate, and improve our website and services.</li>
                    <li>Process and fulfill orders, returns, and warranties.</li>
                    <li>Personalize your experience (e.g., saved cart, recommendations).</li>
                    <li>Communicate about orders, security, and service updates.</li>
                    <li>Detect, prevent, and investigate fraud or misuse.</li>
                    <li>Comply with legal obligations and enforce our terms.</li>
                  </ul>
                  <p className="mt-3 text-sm text-slate-600">
                    Legal bases may include performance of a contract, legitimate
                    interests, compliance with law, and (where applicable) your consent.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Sharing & Payments */}
            <section id="sharing" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">4. Sharing &amp; Payments</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    We share data with vendors who help us run our business (e.g.,
                    hosting, analytics, customer support, logistics). These providers
                    are bound by agreements to protect your information and use it
                    only for our instructions.
                  </p>
                  <div className="not-prose mt-4 rounded-lg border border-amber-200 bg-slate-50 p-3 text-sm">
                    <p className="text-slate-800">
                      <strong>Payments:</strong> Transactions are processed by a
                      third-party provider (Paystack). They receive payment
                      information directly and may process it under their own privacy
                      policy. We do not store your full card details on our servers.
                    </p>
                  </div>
                  <p className="mt-3">
                    We may also disclose information if required by law or to protect
                    our rights, users, or the public.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Retention & Security */}
            <section id="retention-security" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">5. Data Retention &amp; Security</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    We retain personal data only as long as necessary for the purposes
                    described in this policy (for example, while an account is active,
                    to comply with tax and accounting rules, or to resolve disputes).
                  </p>
                  <p className="mt-3">
                    We employ administrative, technical, and physical safeguards to
                    protect your information. However, no method of transmission or
                    storage is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Cookies */}
            <section id="cookies" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Cookie className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">6. Cookies &amp; Similar Technologies</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    We use essential cookies to keep your session and cart working,
                    and (where enabled) analytics cookies to understand site usage.
                    You can control cookies via your browser settings. Some features
                    may not function properly without essential cookies.
                  </p>
                  <p className="mt-3 text-sm">
                    For more detail, see our{" "}
                    <Link href="/policies/cookies" className="text-amber-600 hover:underline">
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            {/* 7. Your Rights */}
            <section id="rights" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">7. Your Privacy Rights</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    Depending on your location, you may have rights to access,
                    correct, delete, or receive a copy of your personal data, and to
                    object to or restrict certain processing. You may also withdraw
                    consent where we rely on consent.
                  </p>
                  <p className="mt-3">
                    To exercise any rights, contact us at{" "}
                    <a
                      href="mailto:info@kbeecomputers.com"
                      className="text-amber-600 hover:underline"
                    >
                      info@kbeecomputers.com
                    </a>
                    . We may need to verify your identity before responding.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. International Transfers */}
            <section id="intl" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">8. International Data Transfers</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    Our service providers may process data in countries outside your
                    own. Where required, we use appropriate safeguards (such as
                    contractual protections) to protect your information.
                  </p>
                </div>
              </div>
            </section>

            {/* 9. Children */}
            <section id="children" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">9. Children’s Privacy</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    Our services are not directed to children under the age of 13, and
                    we do not knowingly collect personal information from them. If you
                    believe a child has provided us personal data, please contact us to
                    delete it.
                  </p>
                </div>
              </div>
            </section>

            {/* 10. Changes */}
            <section id="changes" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">10. Changes to This Policy</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    We may update this policy from time to time. We will post the new
                    version here and update the “Last updated” date above. If changes
                    materially affect you, we may provide additional notice.
                  </p>
                </div>
              </div>
            </section>

            {/* 11. Contact */}
            <section id="contact" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-900">11. Contact Us</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>Questions or requests about this Privacy Policy? Contact us:</p>
                  <ul>
                    <li>
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:info@kbeecomputers.com"
                        className="text-amber-600 hover:underline"
                      >
                        info@kbeecomputers.com
                      </a>
                    </li>
                    <li>
                      <strong>Address:</strong> Tudu, Kingsway Building, Accra, Ghana
                    </li>
                    <li>
                      <strong>Phone/WhatsApp:</strong> +233 24 814 7215
                    </li>
                  </ul>
                  <p className="mt-3 text-sm">
                    You can also reach us via the{" "}
                    <Link href="/contact" className="text-amber-600 hover:underline">
                      Contact page
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            {/* Back to top */}
            <div className="pt-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
                aria-label="Back to top"
              >
                ↑ Back to top
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
