// app/policies/returns/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

const LAST_UPDATED: string = new Date().toLocaleDateString('en-US', {
  timeZone: 'Africa/Accra',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});


export const metadata: Metadata = createPageMetadata({
  title: "Return & Exchange Policy",
  description:
    "KBee Computers return and exchange policy—timelines, eligibility, exclusions, and how to start a return.",
  path: "/policies/returns",
});

export default function ReturnsPolicyPage() {
  // Schema.org MerchantReturnPolicy (summarized)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MerchantReturnPolicy",
    name: "KBee Computers Return & Exchange Policy",
    url: "https://www.kbeecomputers.com/policies/returns",
    merchantReturnDays: 7,
    returnPolicyCategory: "MerchantReturnFiniteReturnWindow",
    refundType: "ExchangeRefund",
    returnMethod: "ByMail",
    returnFees: "OriginalShippingFees",
    inStoreReturnsOffered: true,
    applicableCountry: "GH",
    seller: {
      "@type": "Organization",
      name: "KBee Computers",
      address: {
        "@type": "PostalAddress",
        addressCountry: "GH",
        addressLocality: "Accra",
        streetAddress: "Prudential Bank Ltd. - Kingsway Branch",
      },
    },
    dateModified: LAST_UPDATED,
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b bg-slate-950 text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            KBee Computers
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Return &amp; Exchange Policy
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            We want you to love your purchase. This page explains timelines, eligibility, exclusions,
            and how to start a return or exchange.
          </p>
          <p className="mt-4 inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        {/* On-page nav */}
        <nav
          aria-label="Sections"
          className="mb-8 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6"
        >
          {[
            ["overview", "1. Quick Overview"],
            ["window", "2. Return Window"],
            ["condition", "3. Item Condition"],
            ["exclusions", "4. Exclusions"],
            ["process", "5. How to Start"],
            ["refunds", "6. Refunds & Fees"],
            ["warranty", "7. Warranty & DOA"],
            ["contact", "8. Questions?"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={`#${href}`}
              className="
                rounded-md border bg-white px-3 py-2 text-center font-medium
                text-slate-700 hover:bg-slate-50
              "
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="prose prose-slate max-w-none prose-a:text-amber-600 prose-headings:scroll-mt-24">
          {/* 1. Quick Overview */}
          <section id="overview" className="scroll-mt-28">
            <h2>1. Quick Overview</h2>
            <ul>
              <li><strong>Change of mind:</strong> 7 days from delivery/collection (unopened, unused).</li>
              <li><strong>Defective/DOA:</strong> 14 days for a free exchange or repair assessment.</li>
              <li><strong>Original packaging required</strong> (all accessories, inserts, serial labels).</li>
              <li><strong>Certain items are non-returnable</strong> (see Section 4).</li>
            </ul>
          </section>

          {/* 2. Return window */}
          <section id="window" className="scroll-mt-28">
            <h2>2. Return Window</h2>
            <div className="not-prose overflow-hidden rounded-xl border bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Scenario</th>
                      <th className="px-4 py-3 font-semibold">Timeframe</th>
                      <th className="px-4 py-3 font-semibold">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3">Change of mind (unused, factory-sealed)</td>
                      <td className="px-4 py-3">Within 7 days</td>
                      <td className="px-4 py-3">Refund or store credit (see fees in §6)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Dead on Arrival (DOA) / Defective</td>
                      <td className="px-4 py-3">Within 14 days</td>
                      <td className="px-4 py-3">Exchange or repair; refund if not resolvable</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Warranty issue (after 14 days)</td>
                      <td className="px-4 py-3">Manufacturer/Store warranty period</td>
                      <td className="px-4 py-3">Repair or replacement as per warranty terms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Timeframes run from the date you received/collected the item.
            </p>
          </section>

          {/* 3. Item condition */}
          <section id="condition" className="scroll-mt-28">
            <h2>3. Item Condition Requirements</h2>
            <ul>
              <li>Products must be returned <strong>in the same condition</strong> you received them.</li>
              <li>Include <strong>all accessories, manuals, boxes,</strong> and any bundled items.</li>
              <li>Serial numbers and warranty labels must be <strong>intact and unaltered</strong>.</li>
              <li>
                For laptops/PCs/phones, sign out of accounts and <strong>remove any passwords</strong>. We are not
                responsible for data loss—please back up your data.
              </li>
            </ul>
          </section>

          {/* 4. Exclusions */}
          <section id="exclusions" className="scroll-mt-28">
            <h2>4. Non-Returnable Items</h2>
            <ul>
              <li>Opened software, license keys, digital downloads, and subscriptions.</li>
              <li>Headsets/earbuds, screen protectors, and consumables once opened/used.</li>
              <li>Items damaged by misuse, liquid, power surge, or unauthorized modification.</li>
              <li>Clearance, “as-is”, or final-sale items (where indicated).</li>
            </ul>
          </section>

          {/* 5. Process */}
          <section id="process" className="scroll-mt-28">
            <h2>5. How to Start a Return or Exchange</h2>
            <ol>
              <li>
                <strong>Request an RMA:</strong> Email{" "}
                <a href="mailto:info@kbeecomputers.com" className="text-amber-600 hover:underline">
                  info@kbeecomputers.com
                </a>{" "}
                with your order number, product, and reason. (Or visit{" "}
                <Link href="/contact" className="text-amber-600 hover:underline">
                  contact page
                </Link>{" "}
                if available.)
              </li>
              <li>
                <strong>Prepare the package:</strong> Use original packaging. Include all contents and proof of purchase.
              </li>
              <li>
                <strong>Return method:</strong> Drop off at our store (preferred) or ship it back using a trackable
                service. Keep your receipt and tracking number.
              </li>
            </ol>
          </section>

          {/* 6. Refunds & fees */}
          <section id="refunds" className="scroll-mt-28">
            <h2>6. Refunds, Exchanges &amp; Fees</h2>
            <ul>
              <li>
                <strong>Refund method:</strong> Original payment method or store credit (processing 3–10 business days
                after inspection).
              </li>
              <li>
                <strong>Restocking:</strong> For change-of-mind returns, a standard{" "}
                <strong>10% restocking fee</strong> may apply to cover handling and testing.
              </li>
              <li>
                <strong>Shipping:</strong> Original and return shipping are non-refundable unless we made an error or the
                product is confirmed DOA/defective within the window.
              </li>
              <li>
                <strong>Inspection:</strong> If returned items are missing parts, show wear, or fail testing, we may
                decline the return or deduct the cost of repair/repackaging.
              </li>
            </ul>
          </section>

          {/* 7. Warranty & DOA */}
          <section id="warranty" className="scroll-mt-28">
            <h2>7. Warranty &amp; DOA</h2>
            <p>
              Most electronics include a manufacturer or store warranty. If your item is DOA or develops a fault within
              the stated window, we’ll prioritize repair or exchange. After the first 14 days, warranty service applies.
              Physical damage and liquid damage are not covered.
            </p>
          </section>

          {/* 8. Contact */}
          <section id="contact" className="scroll-mt-28">
            <h2>8. Questions?</h2>
            <p>
              We’re here to help you choose the best path (exchange, repair, or refund). Contact us:
            </p>
            <ul>
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:info@kbeecomputers.com" className="text-amber-600 hover:underline">
                  info@kbeecomputers.com
                </a>
              </li>
              <li>
                <strong>Phone/WhatsApp:</strong> +233 24 814 7215
              </li>
              <li>
                <strong>Store:</strong> Tudu, Kingsway Building, Accra, Ghana
              </li>
            </ul>
            <p className="mt-3 text-sm text-slate-600">
              See also our{" "}
              <Link href="/policies/privacy" className="text-amber-600 hover:underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/policies/cookies" className="text-amber-600 hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Callout card */}
        <div className="mt-10 rounded-xl border bg-slate-950 p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-semibold">Start a return</h3>
              <p className="mt-1 text-sm text-slate-300">
                Email us your order number, product, and reason for return to get an RMA.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:info@kbeecomputers.com?subject=RMA%20Request"
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
              >
                Request RMA by Email
              </a>
              <Link
                href="/contact"
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Contact Support
              </Link>
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
