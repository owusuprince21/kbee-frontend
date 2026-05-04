import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/currencyformat';

type Props = {
  title: string;
  productTitle: string;
  specs?: string;
  price: number;          // final price you want to show
  compareAt?: number;     // crossed-out price (optional)
  image?: string | null;  // can be absolute, /path, or falsy
  href: string;
  ctaText?: string;
};

function ensureImg(u?: string | null) {
  if (!u) return '/placeholder.png';
  let s = String(u).trim();
  if (!s) return '/placeholder.png';
  if (s.startsWith('//')) s = 'https:' + s;
  if (s.startsWith('http://')) s = s.replace(/^http:\/\//, 'https://');
  if (s.startsWith('https://') || s.startsWith('/')) return s;
  // anything else is probably an id — fall back
  return '/placeholder.png';
}

export default function HotDeal({
  title,
  productTitle,
  specs = '',
  price,
  compareAt,
  image,
  href,
  ctaText = 'Shop Now',
}: Props) {
  const safeImage = ensureImg(image);
  const hasDiscount =
    typeof compareAt === 'number' &&
    Number.isFinite(compareAt) &&
    compareAt > price;

  const percent = hasDiscount
    ? Math.round(((compareAt! - price) / compareAt!) * 100)
    : 0;

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div
          className="
            group relative overflow-hidden rounded-2xl border border-slate-200/60
            bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50
            p-4 sm:p-6 transition-shadow hover:shadow-lg
          "
          style={{
            backgroundImage:
              'radial-gradient(60% 60% at 110% -10%, rgba(99,102,241,0.18) 0%, rgba(255,255,255,0) 60%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: 'radial-gradient(40% 40% at 80% 10%, rgba(59,130,246,0.20), transparent 60%)' }}
          />

          <div className="relative grid items-center gap-4 md:grid-cols-2 md:gap-6">
            {/* Copy */}
            <div className="order-2 text-slate-900 md:order-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                {title}
              </div>

              <h3 className="mb-1 text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                {productTitle}
              </h3>

              {specs ? (
                <p className="mb-3 text-sm text-slate-700 sm:text-[15px]">{specs}</p>
              ) : null}

              <div className="mb-4 flex items-center gap-3">
                <div className="flex flex-col">
                  {hasDiscount && (
                    <span className="text-xs leading-none text-slate-500 line-through">
                      {formatGHS(compareAt!)}
                    </span>
                  )}
                  <span className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    {formatGHS(price)}
                  </span>
                </div>

                {hasDiscount && percent > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                    {percent}% OFF
                  </span>
                )}
              </div>

              <Link href={href || '#'} className="inline-block">
                <Button
                  className="
                    rounded-full bg-indigo-600 text-white hover:bg-indigo-700
                    px-6 py-3 sm:px-7 sm:py-3.5
                    transition-transform group-hover:translate-y-[-1px]
                  "
                >
                  {ctaText}
                  <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">→</span>
                </Button>
              </Link>
            </div>

            {/* Image */}
            <div className="relative order-1 md:order-2">
              <div className="relative h-44 transition-transform duration-300 group-hover:scale-[1.03] sm:h-52 md:h-64">
                <Image
                  src={safeImage}
                  alt={productTitle || 'Hot deal product'}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <div className="pointer-events-none absolute -right-6 -top-6 hidden h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-200 to-sky-200 opacity-60 blur-2xl md:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
