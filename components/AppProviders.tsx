'use client';

import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { commerceKeys } from '@/lib/api/commerce';

const emptyCart = { id: 0, items: [], subtotal: '0.00' };
const PUBLIC_QUERY_CACHE_KEY = 'kbee-public-query-cache-v1';
const PUBLIC_QUERY_CACHE_MAX_AGE = 1000 * 60 * 60 * 6;
const PUBLIC_QUERY_PREFIXES = ['home', 'products', 'product', 'related-products', 'categories', 'hot-items'];

function isPublicQuery(queryKey: readonly unknown[]) {
  return PUBLIC_QUERY_PREFIXES.includes(String(queryKey[0] || ''));
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime: 1000 * 60 * 60 * 6,
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function CommerceEventBridge({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    const refreshCart = () => {
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart });
    };
    const clearCart = () => {
      queryClient.setQueriesData({ queryKey: commerceKeys.cart }, emptyCart);
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart });
    };
    const refreshWishlist = () => {
      queryClient.invalidateQueries({ queryKey: commerceKeys.wishlist });
    };

    window.addEventListener('cart:updated', refreshCart);
    window.addEventListener('cart:cleared', clearCart);
    window.addEventListener('wishlist:updated', refreshWishlist);
    return () => {
      window.removeEventListener('cart:updated', refreshCart);
      window.removeEventListener('cart:cleared', clearCart);
      window.removeEventListener('wishlist:updated', refreshWishlist);
    };
  }, [queryClient]);

  return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PUBLIC_QUERY_CACHE_KEY);
      const cached = raw ? JSON.parse(raw) : null;
      if (cached?.timestamp && Date.now() - cached.timestamp < PUBLIC_QUERY_CACHE_MAX_AGE && cached.clientState) {
        hydrate(queryClient, cached.clientState);
      } else if (cached) {
        window.localStorage.removeItem(PUBLIC_QUERY_CACHE_KEY);
      }
    } catch {
      window.localStorage.removeItem(PUBLIC_QUERY_CACHE_KEY);
    }
  }, [queryClient]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        try {
          const clientState = dehydrate(queryClient, {
            shouldDehydrateQuery: (query) =>
              query.state.status === 'success' && isPublicQuery(query.queryKey),
          });
          window.localStorage.setItem(
            PUBLIC_QUERY_CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), clientState })
          );
        } catch {
          // Best-effort cache only. Rendering must not depend on storage availability.
        }
      }, 300);
    });

    return () => {
      if (timeout) clearTimeout(timeout);
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <CommerceEventBridge queryClient={queryClient} />
      {children}
    </QueryClientProvider>
  );
}
