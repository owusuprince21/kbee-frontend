'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function GlobalRouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const startTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);

  // Start after a short delay to avoid flicker on ultra-fast nav
  const start = () => {
    if (startTimer.current != null) return;
    startTimer.current = window.setTimeout(() => setVisible(true), 180); // delay (ms)
    // Safety auto-hide in case something goes wrong
    safetyTimer.current = window.setTimeout(stop, 4000);
  };

  const stop = () => {
    if (startTimer.current != null) {
      window.clearTimeout(startTimer.current);
      startTimer.current = null;
    }
    if (safetyTimer.current != null) {
      window.clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    setVisible(false);
  };

  // Detect link clicks (same-origin) & back/forward
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Walk up to the nearest anchor
      let el = e.target as Element | null;
      while (el && el.tagName !== 'A') el = el.parentElement;
      if (!(el instanceof HTMLAnchorElement)) return;

      const href = el.getAttribute('href');
      if (!href || href.startsWith('#') || (el.target && el.target !== '_self')) return;

      // External?
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
      } catch {
        // ignore malformed
      }

      start();
    };

    const onPopState = () => start();

    window.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  // When the URL actually changed, hide
  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] grid place-items-center bg-white/80 dark:bg-black/70">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400/25" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 animate-spin" />
          <div className="absolute inset-1 overflow-hidden rounded-full bg-white shadow-sm dark:bg-zinc-900">
            <Image
              src="/logo.png"   // from /public/logo.png
              alt="Kbee Computers"
              fill
              sizes="64px"
              className="object-contain p-2"
              priority
            />
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</p>
        <span className="sr-only">Navigating to the requested page</span>
      </div>
    </div>
  );
}
