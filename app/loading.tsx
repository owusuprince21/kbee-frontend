// app/loading.tsx
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-white/90 dark:bg-black/80">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400/25" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 animate-spin" />
          <div className="absolute inset-1 overflow-hidden rounded-full bg-white shadow-sm dark:bg-zinc-900">
            <Image
              src="/logo.png"
              alt="Kbee Computers"
              fill
              sizes="64px"
              className="object-contain p-2"
              priority
            />
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</p>
        <span className="sr-only">Please wait while the page loads</span>
      </div>
    </div>
  );
}
