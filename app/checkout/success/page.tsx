'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/api/http';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

type VerifyResp = {
  order_code?: string | null;
  customer_is_guest?: boolean;
  payment_status?: string;
  receipt_url?: string | null;
};
const CHECKOUT_CART_SNAPSHOT_KEY = 'kbee_checkout_cart_snapshot';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasHydrated, authReady } = useAuthStore();
  const [savedCode, setSavedCode] = useState('');
  const [savedReceiptUrl, setSavedReceiptUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const reference =
    searchParams.get('reference') ||
    searchParams.get('trxref') ||
    searchParams.get('tx_ref') ||
    '';
  const code = searchParams.get('code') || savedCode;
  const receiptUrl = searchParams.get('receipt') || savedReceiptUrl;
  const codeLabel = code || (reference ? 'Confirming order code...' : 'Order code unavailable');

  const clearPaymentState = (orderCode?: string | null, receiptUrl?: string | null) => {
    try {
      localStorage.removeItem('kbee_momo_tx_ref');
      localStorage.removeItem('kbee_card_tx_ref');
      ['cart', 'cartItems', 'kbee-cart', 'cart-storage', CHECKOUT_CART_SNAPSHOT_KEY].forEach((key) => localStorage.removeItem(key));
      useCartStore.getState().clearCart();
      window.dispatchEvent(new Event('cart:cleared'));
      window.dispatchEvent(new Event('cart:updated'));
      if (orderCode) localStorage.setItem('kbee_last_order_code', orderCode);
      if (receiptUrl) localStorage.setItem('kbee_last_receipt_url', receiptUrl);
    } catch {}
  };

  useEffect(() => {
    try {
      setSavedCode(localStorage.getItem('kbee_last_order_code') || '');
      setSavedReceiptUrl(localStorage.getItem('kbee_last_receipt_url') || '');
    } catch {}
  }, []);

  const verifyReference = async (ref: string, options: { showLoading?: boolean } = {}) => {
    if (options.showLoading !== false) setVerifying(true);
    setVerifyError('');
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 0; attempt < 24; attempt++) {
      try {
        const result = await http<VerifyResp>(`/api/payments/verify/${ref}/`, {
          allowGuest: !user,
        });
        const status = (result.payment_status || '').toLowerCase();
        if (status === 'successful' || status === 'success') {
          clearPaymentState(result.order_code, result.receipt_url);
          if (result.customer_is_guest === false) {
            toast.success('Payment verified. Your order is ready.');
            router.replace('/orders');
            router.refresh();
            return;
          }
          setSavedCode(result.order_code || '');
          setSavedReceiptUrl(result.receipt_url || '');
          setVerifying(false);
          const params = new URLSearchParams();
          if (result.order_code) params.set('code', result.order_code);
          if (result.receipt_url) params.set('receipt', result.receipt_url);
          router.replace(`/checkout/success${params.toString() ? `?${params.toString()}` : ''}`);
          return;
        }
      } catch {}
      await delay(5000);
    }

    setVerifying(false);
    setVerifyError('Payment confirmation is still pending. Please try again in a moment.');
  };

  useEffect(() => {
    if (!reference || code || !hasHydrated || !authReady) return;
    let cancelled = false;

    (async () => {
      setVerifyError('');
      await verifyReference(reference);
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, code, hasHydrated, authReady, user]);

  if (verifying) {
    return (
      <main className="min-h-[70vh] bg-white px-4 py-16">
        <section className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="relative mb-5 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/25" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-amber-600" />
            <div className="absolute inset-4 rounded-full bg-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Confirming payment</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Please keep this page open while we create your order.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-white px-4 py-16">
      <section className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 ring-8 ring-green-100">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-950">Order placed successfully</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {verifyError || 'Thank you. Your payment was confirmed and your order has been created.'}
        </p>

        <div className="mx-auto mt-8 max-w-sm rounded border bg-gray-50 px-4 py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Your order code</div>
          <div className="mt-2 break-all text-2xl font-bold text-gray-950">
            {codeLabel}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Please keep this code. You can use it when contacting support about your order.
          </p>
          {reference && !code ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => verifyReference(reference)}
              disabled={verifying}
            >
              {verifying ? 'Checking...' : 'Get Order Code'}
            </Button>
          ) : null}
        </div>

        {receiptUrl ? (
          <div className="mx-auto mt-4 max-w-sm">
            <Button asChild variant="outline" className="w-full">
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                <ReceiptText className="mr-2 h-4 w-4" />
                View Receipt
              </a>
            </Button>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
