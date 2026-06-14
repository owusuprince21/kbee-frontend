'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { commerceKeys } from '@/lib/api/commerce';

const emptyCart = { id: 0, items: [], subtotal: '0.00' };

function CommerceEventBridge({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    const refreshCart = () => {
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart });
    };
    const clearCart = () => {
      queryClient.setQueryData(commerceKeys.cart, emptyCart);
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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CommerceEventBridge queryClient={queryClient} />
      {children}
    </QueryClientProvider>
  );
}
