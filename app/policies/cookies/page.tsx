// app/policies/cookies/page.tsx
import Link from "next/link";
import {
  Cookie as CookieIcon,
  Info,
  Database,
  FileCheck2,
  SlidersHorizontal,
  Share2,
} from "lucide-react";

const LAST_UPDATED: string = new Date().toLocaleDateString('en-US', {
  timeZone: 'Africa/Accra',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});


export const metadata = {
  title: "Cookie Policy | KBee Computers",
  description:
    "Understand how KBee Computers uses cookies and similar technologies, and how you can control your preferences.",
};

export default function CookiePolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "KBee Computers Cookie Policy",
    url: "https://www.kbeecomputers.com/policies/cookies",
    dateModified: LAST_UPDATED,
    about: {
      "@type": "Thing",
      name: "Cookies and similar technologies",
    },
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
    ["overview", "Overview", CookieIcon],
    ["what-are-cookies", "What Are Cookies?", Info],
    ["types", "Types of Cookies", Database],
    ["how-we-use", "How We Use Cookies", FileCheck2],
    ["manage", "Manage Preferences", SlidersHorizontal],
    ["third-parties", "Third-Party Cookies", Share2],
    ["changes", "Changes", Info],
    ["contact", "Contact Us", FileCheck2],
  ] as const;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Hero */}
      <section className="border-b bg-gradient-to-br from-yellow-50 via-white to-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            KBee Computers
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Cookie Policy
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            This page explains what cookies are, how we use them, and how you can manage your preferences.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Last updated: <span className="font-medium">{LAST_UPDATED}</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[260px_1fr]">
        {/* Desktop sticky TOC */}
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
                    className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-yellow-50 hover:text-slate-900"
                  >
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-yellow-600" />
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
                className="rounded-lg border bg-white px-3 py-2 text-center font-medium text-slate-700 hover:bg-yellow-50"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="space-y-6 lg:space-y-8">
            {/* 1. Overview */}
            <section id="overview" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <CookieIcon className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">1. Overview</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none prose-a:text-yellow-600">
                  <p>
                    We use cookies and similar technologies to run our website, keep your cart and session working,
                    analyze performance, and personalize your experience. Some cookies are essential and cannot be
                    switched off, while others are optional and used only with your consent where applicable.
                  </p>
                  <p className="text-sm">
                    For how we handle personal data more broadly, see our{" "}
                    <Link href="/policies/privacy" className="text-yellow-600 hover:underline">
                      Privacy Policy
                    </Link>.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. What Are Cookies */}
            <section id="what-are-cookies" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">2. What Are Cookies?</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    Cookies are small text files placed on your device by websites you visit. They are widely used to
                    make websites work, or work more efficiently, as well as to provide information to the site owners.
                    We may also use local storage, session storage, and similar technologies for the same purposes.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Types */}
            <section id="types" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">3. Types of Cookies We Use</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none prose-li:marker:text-yellow-500">
                  <ul>
                    <li>
                      <strong>Strictly Necessary (Essential):</strong> required for core functions like page navigation,
                      secure login, and cart/checkout. The site cannot function properly without these.
                    </li>
                    <li>
                      <strong>Performance / Analytics:</strong> help us understand usage (e.g., page views, traffic sources)
                      so we can improve performance and content.
                    </li>
                    <li>
                      <strong>Functional:</strong> remember choices (e.g., preferred currency or recently viewed items)
                      to provide enhanced features.
                    </li>
                    <li>
                      <strong>Marketing:</strong> used to deliver relevant promotions and measure campaign effectiveness.
                      These may be set by us or our partners.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. How we use + table */}
            <section id="how-we-use" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">4. How We Use Cookies</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    Below are examples of cookies/local storage keys we may use. The exact names can change as we improve
                    our website:
                  </p>
                </div>

                <div className="not-prose mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Name</th>
                          <th className="px-4 py-3 font-semibold">Category</th>
                          <th className="px-4 py-3 font-semibold">Purpose</th>
                          <th className="px-4 py-3 font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-3 font-mono">kb_session</td>
                          <td className="px-4 py-3">Essential</td>
                          <td className="px-4 py-3">Maintains secure login and session continuity.</td>
                          <td className="px-4 py-3">Session</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono">kb_cart</td>
                          <td className="px-4 py-3">Essential</td>
                          <td className="px-4 py-3">Stores your cart contents between pages and visits.</td>
                          <td className="px-4 py-3">Up to 30 days</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono">kb_consent</td>
                          <td className="px-4 py-3">Essential</td>
                          <td className="px-4 py-3">Remembers your cookie preferences and consent choices.</td>
                          <td className="px-4 py-3">6–12 months</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono">kb_recent</td>
                          <td className="px-4 py-3">Functional</td>
                          <td className="px-4 py-3">Keeps recently viewed products for quick access.</td>
                          <td className="px-4 py-3">30–90 days</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono">_analytics*</td>
                          <td className="px-4 py-3">Performance</td>
                          <td className="px-4 py-3">Helps measure site traffic and performance.</td>
                          <td className="px-4 py-3">Up to 13 months</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono">_mkt*</td>
                          <td className="px-4 py-3">Marketing</td>
                          <td className="px-4 py-3">Delivers more relevant ads and measures campaigns.</td>
                          <td className="px-4 py-3">Up to 13 months</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="prose prose-slate mt-3 max-w-none text-sm text-slate-600">
                  We may also use short-lived tokens in local/session storage to optimize page experience. We do{" "}
                  <em>not</em> store full payment card data in cookies or local storage.
                </p>
              </div>
            </section>

            {/* 5. Manage preferences */}
            <section id="manage" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">5. Managing Your Cookie Preferences</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none prose-li:marker:text-yellow-500">
                  <p>You can control cookies in several ways:</p>
                  <ul>
                    <li>
                      <strong>Site Preferences:</strong> Use the cookie banner or the button below to update your
                      choices (where available).
                    </li>
                    <li>
                      <strong>Browser Settings:</strong> Most browsers let you block or delete cookies. Doing so may
                      affect site functionality—especially essential features like login and cart.
                    </li>
                    <li>
                      <strong>Opt-Out Tools:</strong> Some analytics/ads providers offer their own opt-outs.
                    </li>
                  </ul>
                  <div className="not-prose mt-4">
                    {/* Hook this to your consent manager */}
                    <button
                      type="button"
                      data-cm-open="preferences"
                      className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
                      aria-label="Open cookie preferences"
                    >
                      Open Cookie Preferences
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Third parties */}
            <section id="third-parties" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">6. Third-Party Cookies</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    Some cookies are set by third parties (for example, analytics, embedded media, or advertising
                    partners). These parties may use information about your visits to this and other websites subject
                    to their own privacy policies. Where required, we request your consent before using non-essential
                    third-party cookies.
                  </p>
                </div>
              </div>
            </section>

            {/* 7. Changes */}
            <section id="changes" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">7. Changes to This Cookie Policy</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>
                    We may update this policy to reflect changes to our website or applicable regulations. We will post
                    updates here and revise the “Last updated” date above. If changes materially affect you, we may
                    provide additional notice.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. Contact */}
            <section id="contact" className="scroll-mt-28">
              <header className="mb-3 flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">8. Contact Us</h2>
              </header>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p>Questions about this Cookie Policy? Contact us:</p>
                  <ul>
                    <li>
                      <strong>Email:</strong>{" "}
                      <a href="mailto:hello@kbeecomputers.com" className="text-yellow-600 hover:underline">
                        hello@kbeecomputers.com
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
                    See also our{" "}
                    <Link href="/policies/privacy" className="text-yellow-600 hover:underline">
                      Privacy Policy
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
                className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
                aria-label="Back to top"
              >
                ↑ Back to top
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
