// app/loading.tsx
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-white/95 backdrop-blur-md dark:bg-zinc-950/90">
      <div className="flex w-full max-w-xs flex-col items-center px-6 text-center">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-amber-300/20 blur-xl" />
          <div className="absolute inset-0 rounded-full border border-amber-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-600 border-r-amber-600" />
          <div className="absolute inset-2 animate-pulse rounded-full border border-slate-200 bg-white shadow-lg shadow-amber-600/10 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute inset-1 overflow-hidden rounded-full">
              <Image
                src="/logo.jpeg"
                alt="Kbee Computers"
                fill
                sizes="80px"
                className="rounded-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Preparing your experience</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Loading products, cart, and account details.</p>
        </div>
        <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-6 animate-pulse rounded-full bg-amber-600" />
          <span className="h-1.5 w-2 animate-pulse rounded-full bg-amber-500 delay-150" />
          <span className="h-1.5 w-2 animate-pulse rounded-full bg-amber-300 delay-300" />
        </div>
        <span className="sr-only">Please wait while the page loads</span>
      </div>
    </div>
  );
}
