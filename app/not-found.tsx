// app/not-found.tsx
import Link from "next/link";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
const DEFAULT_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
  "Hi, I couldn't find the product/page I was looking for. Please help me.";

function buildWhatsAppLink(phone: string, message: string) {
  const cleanPhone = (phone || "").replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

export default function NotFound() {
  const whatsappHref = buildWhatsAppLink(WHATSAPP_NUMBER, DEFAULT_MESSAGE);

  return (
    <main className="relative min-h-[80vh] overflow-hidden bg-white px-4 py-14">
      {/* Animated background blobs (Tailwind-only) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 blur-3xl animate-blob" />
        <div className="absolute top-20 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-slate-200 to-pink-200 blur-3xl animate-blob animation-delay-4000" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-black/5 blur-md" />
          <div className="absolute -inset-4 -z-10 rounded-3xl border border-black/5 animate-pulse" />

          <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-30" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
            </span>
            <span className="text-sm font-medium text-gray-800">
              Oops… this page doesn’t exist
            </span>
          </div>
        </div>

        <h1 className="text-6xl font-bold tracking-tight text-gray-900 sm:text-7xl">
          404
        </h1>

        <p className="mt-3 max-w-xl text-base text-gray-600 sm:text-lg">
          The page you’re looking for may have been moved, deleted, or the link is
          incorrect. You can go home, browse products, or message us on WhatsApp.
        </p>

        <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-3">
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
          >
            <span>Go Home</span>
            <span className="transition group-hover:translate-x-0.5">→</span>
          </Link>

          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50"
          >
            Browse Products
          </Link>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
