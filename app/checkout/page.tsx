// app/checkout/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { http, ApiError, type Paginated } from '@/lib/api/http';
import { useAuthStore } from '@/store/authStore';
import {
  getShippingQuote,
  listShippingRegions,
  listShippingTowns,
  type ShippingQuote,
  type ShippingRegion,
  type ShippingTown,
} from '@/lib/api/shipping';

/* ---------- identity helpers ---------- */
type AnyRec = Record<string, any>;
function extractUserIdentity(u: unknown) {
  const anyU = (u || {}) as AnyRec;
  const uid = anyU.uid ?? anyU.id ?? anyU.firebase_uid ?? null;
  const email = anyU.email ?? null;
  const name = anyU.displayName ?? anyU.full_name ?? anyU.name ?? null;
  const photo = anyU.photoURL ?? anyU.photo_url ?? null;
  return { uid, email, name, photo };
}
function buildFirebaseHeaders(user: unknown): HeadersInit {
  const { uid, email, name, photo } = extractUserIdentity(user);
  const h: Record<string, string> = {};
  const firebaseUid = uid == null ? '' : String(uid);
  if (firebaseUid && !firebaseUid.startsWith('customer:')) h['X-Firebase-UID'] = firebaseUid;
  if (email) h['X-User-Email'] = String(email);
  if (name) h['X-User-Name'] = String(name);
  if (photo) h['X-User-Photo'] = String(photo);
  return h;
}

/* ---------- types ---------- */
type Address = {
  id: number;
  full_name?: string | null;
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
  is_default?: boolean;
};

type CartItemDTO = {
  id: number | string;
  product: { name: string };
  quantity: number;
  unit_price: number;
  product_id?: number | null;
  slug?: string | null;
};
type CartDTO = { items: CartItemDTO[]; subtotal?: number };

type InitResp = {
  tx_ref: string;
  payment_id: number;
  channel?: 'mobile_money' | 'card' | 'checkout';
  channels?: string[];
  next_url?: string | null;
  gateway: any;
};

type VerifyResp = {
  detail?: string;
  order_id?: number | string | null;
  order_code?: string | null;
  customer_is_guest?: boolean;
  order_status?: string;
  payment_status?: string;
  receipt_url?: string | null;
};

/* ---------- utils ---------- */
const toNum = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];
  const rec = payload as AnyRec;
  if (Array.isArray(rec.results)) return rec.results as T[];
  if (Array.isArray(rec.data)) return rec.data as T[];
  if (rec.data && typeof rec.data === 'object' && Array.isArray((rec.data as AnyRec).results)) {
    return (rec.data as AnyRec).results as T[];
  }
  return [];
}

function normalizeCart(api: any): CartDTO {
  if (!api) return { items: [] };
  const rawItems =
    api.items ?? api.data?.items ?? api.cart_items ?? (Array.isArray(api) ? api : null);

  const items: CartItemDTO[] = Array.isArray(rawItems)
    ? rawItems
        .map((it: any): CartItemDTO | null => {
          const name = it?.product?.name ?? it?.product_name ?? it?.name ?? it?.title ?? 'Item';
          const unit =
            toNum(it?.unit_price) || toNum(it?.price) || toNum(it?.final_price) || toNum(it?.product_price);
          const qty = toNum(it?.quantity ?? it?.qty ?? 1);
          const pidCandidate = toNum(it?.product_id) || toNum(it?.id);
          const id = String(it?.id ?? it?.product_id ?? name);
          const slug = it?.product_slug ?? it?.slug ?? null;
          if (!qty || !unit) return null;
          return {
            id,
            product: { name: String(name) },
            quantity: qty,
            unit_price: unit,
            product_id: pidCandidate || null,
            slug,
          };
        })
        .filter((x): x is CartItemDTO => x !== null)
    : [];

  const subtotal = toNum(api?.subtotal) || toNum(api?.subtotal_amount) || toNum(api?.cart_subtotal);
  return { items, subtotal: items.length ? subtotal || undefined : undefined };
}

function readLocalCart(): CartDTO | null {
  if (typeof window === 'undefined') return null;
  const keys = ['cart', 'cartItems', 'kbee-cart'];
  for (const k of keys) {
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const normalized = normalizeCart(parsed);
      if (normalized.items.length) return normalized;
    } catch {}
  }
  return null;
}

/* ---------- page ---------- */
export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasHydrated, authReady } = useAuthStore();
  const me = useMemo(() => extractUserIdentity(user), [user]);
  const allowGuestRequests = !user;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [regions, setRegions] = useState<ShippingRegion[]>([]);
  const [towns, setTowns] = useState<ShippingTown[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [shippingTownId, setShippingTownId] = useState<number | ''>('');
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);

  const [addressId, setAddressId] = useState<number | ''>('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAddress, setGuestAddress] = useState({
    full_name: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postal_code: '',
    country: 'Ghana',
  });
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');

  const [payMethod, setPayMethod] = useState<'momo' | 'card'>('momo');
  const [cardEmail, setCardEmail] = useState<string>('');

  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentLocked, setPaymentLocked] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('Confirming your payment...');
  const autoVerifyRef = useRef<string | null>(null);

  // Keep refs SEPARATE to avoid mixing MoMo <-> Card
  const [momoRef, setMomoRef] = useState<string | null>(null);
  const [cardRef, setCardRef] = useState<string | null>(null);

  // NEW: Fallback URLs when popup gets blocked
  const [momoNextUrl, setMomoNextUrl] = useState<string | null>(null);
  const [cardAuthUrl, setCardAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const callbackRef =
      searchParams.get('reference') ||
      searchParams.get('trxref') ||
      searchParams.get('tx_ref') ||
      '';
    const savedCardRef = window.localStorage.getItem('kbee_card_tx_ref');
    const savedMomoRef = window.localStorage.getItem('kbee_momo_tx_ref');
    if (callbackRef) setCardRef(callbackRef);
    else if (savedCardRef) setCardRef(savedCardRef);
    if (savedMomoRef) setMomoRef(savedMomoRef);
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const firebaseName = me.name || '';
    const firebaseEmail = me.email || '';
    if (firebaseName) {
      setGuestAddress((addr) => ({
        ...addr,
        full_name: addr.full_name || firebaseName,
      }));
    }
    if (firebaseEmail) setGuestEmail((current) => current || firebaseEmail);
    setCardEmail((current) => current || firebaseEmail);
  }, [user, me.name, me.email]);

  // helper: refetch server cart
  const fetchServerCart = async (headers: HeadersInit) => {
    const apiRes = await http<any>(`/api/cart/?_=${Date.now()}`, { headers, allowGuest: allowGuestRequests }); // cache-buster
    return normalizeCart(apiRes);
  };

  // helper: push local items to server /api/cart/add_item/
  const syncLocalToServer = async (headers: HeadersInit, local: CartDTO) => {
    if (!local?.items?.length) return false;
    setSyncing(true);
    let posted = 0;

    for (const it of local.items) {
      const pid = toNum(it.product_id ?? it.id);
      const qty = toNum(it.quantity || 1);
      if (!pid || !qty) continue;

      try {
        await http('/api/cart/add_item/', {
          method: 'POST',
          headers,
          allowGuest: allowGuestRequests,
          body: { product_id: pid, quantity: qty },
        });
        posted++;
      } catch {
        /* continue */
      }
    }

    setSyncing(false);
    return posted > 0;
  };

  // load addresses + cart (use API, fall back to localStorage; if server empty and local exists → sync up)
  useEffect(() => {
    const headers = buildFirebaseHeaders(user);

    (async () => {
      try {
        const res = await http<Address[] | Paginated<Address>>('/api/addresses/', { headers, allowGuest: allowGuestRequests });
        const list = unwrapList<Address>(res);
        setAddresses(list);
        const def =
          list.find(a => a.is_default) ||
          list[0];
        if (def) {
          setAddressId(def.id);
          setPhone(def.phone || '');
          setGuestAddress((addr) => ({
            ...addr,
            full_name: addr.full_name || def.full_name || me.name || '',
            line1: addr.line1 || def.line1 || '',
            line2: addr.line2 || def.line2 || '',
            city: addr.city || def.city || '',
            region: addr.region || def.region || '',
            postal_code: addr.postal_code || def.postal_code || '',
            country: addr.country || def.country || 'Ghana',
          }));
        }
      } catch {
        setAddresses([]);
      }
    })();

    (async () => {
      try {
        setLoadingCart(true);
        let server = await fetchServerCart(headers);

        if (!server.items.length) {
          const local = readLocalCart();
          if (local?.items?.length) {
            const pushed = await syncLocalToServer(headers, local);
            if (pushed) {
              server = await fetchServerCart(headers);
              toast.success('Cart synced to your account.');
            }
          }
        }

        setCart(server);
      } catch {
        const lc = readLocalCart();
        setCart(lc);
      } finally {
        setLoadingCart(false);
      }
    })();
  }, [user, me.name, allowGuestRequests]);

  // subtotal prefers backend value if present; else sum items
  const subtotal = useMemo(() => {
    if (!cart) return 0;
    if (cart.subtotal != null) return toNum(cart.subtotal);
    return (cart.items ?? []).reduce(
      (acc, it) => acc + toNum(it.unit_price) * toNum(it.quantity || 1),
      0
    );
  }, [cart]);

  useEffect(() => {
    let alive = true;
    listShippingRegions().then((data) => {
      if (alive) setRegions(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setTowns([]);
    setShippingTownId('');
    setShippingQuote(null);
    if (!selectedRegion) return;
    listShippingTowns(selectedRegion).then((data) => {
      if (alive) setTowns(data);
    });
    return () => {
      alive = false;
    };
  }, [selectedRegion]);

  useEffect(() => {
    let alive = true;
    if (!shippingTownId) {
      setShippingQuote(null);
      return;
    }
    getShippingQuote(shippingTownId, subtotal)
      .then((quote) => {
        if (!alive) return;
        setShippingQuote(quote);
        setGuestAddress((addr) => ({
          ...addr,
          region: quote.town.region.name,
          city: quote.town.name,
        }));
      })
      .catch(() => {
        if (alive) setShippingQuote(null);
      });
    return () => {
      alive = false;
    };
  }, [shippingTownId, subtotal]);

  const shipping = toNum(shippingQuote?.shipping_fee);
  const paymentCharge = toNum(shippingQuote?.payment_charge);
  const chargePercent = toNum(shippingQuote?.charge_percent);
  const grandTotal = subtotal + shipping + paymentCharge;

  // auto-fill phone when address changes (if blank)
  useEffect(() => {
    if (!addressId) return;
    const a = addresses.find(x => x.id === addressId);
    if (a && !phone) setPhone(a.phone || '');
  }, [addressId, addresses, phone]);

  /* ---------- server helpers ---------- */
  const buildHeaders = () => buildFirebaseHeaders(user);

  const ensureCheckoutAddress = async () => {
    if (!shippingTownId) throw new Error('Choose your delivery region and town.');
    if (!guestAddress.full_name.trim()) throw new Error('Enter your full name.');
    if (!phone.trim()) throw new Error('Enter your phone number.');
    if (!addressId && !guestAddress.line1.trim()) throw new Error('Enter your delivery address.');
    if (!guestEmail.trim() && !me.email) throw new Error('Enter your email for the receipt.');

    const headers = buildHeaders();
    if (guestEmail.trim() || me.email || guestAddress.full_name.trim() || phone.trim()) {
      await http('/api/customers/me/', {
        method: 'PATCH',
        headers,
        allowGuest: allowGuestRequests,
        body: {
          email: guestEmail.trim() || me.email || '',
          full_name: guestAddress.full_name.trim(),
          phone: phone.trim(),
        },
      }).catch(() => null);
    }

    if (addressId) {
      await http(`/api/addresses/${addressId}/`, {
        method: 'PATCH',
        headers,
        allowGuest: allowGuestRequests,
        body: {
          full_name: guestAddress.full_name.trim(),
          phone: phone.trim(),
        },
      }).catch(() => null);
      return Number(addressId);
    }

    const created = await http<Address>('/api/addresses/', {
      method: 'POST',
      headers,
      allowGuest: allowGuestRequests,
      body: {
        ...guestAddress,
        full_name: guestAddress.full_name.trim(),
        line1: guestAddress.line1.trim(),
        phone: phone.trim(),
        is_default: true,
      },
    });
    setAddresses((prev) => [created, ...prev]);
    setAddressId(created.id);
    return created.id;
  };

  const clearLocalCart = () => {
    try {
      const keys = ['cart', 'cartItems', 'kbee-cart', 'cart-storage'];
      keys.forEach(k => localStorage.removeItem(k));
      window.dispatchEvent(new Event('cart:cleared'));
      window.dispatchEvent(new Event('cart:updated'));
    } catch {}
    setCart({ items: [], subtotal: 0 });
  };

  const finishVerifiedPayment = (verification?: VerifyResp | null) => {
    const orderCode = verification?.order_code || '';
    clearLocalCart();
    try {
      localStorage.removeItem('kbee_momo_tx_ref');
      localStorage.removeItem('kbee_card_tx_ref');
      if (orderCode) localStorage.setItem('kbee_last_order_code', orderCode);
      if (verification?.receipt_url) localStorage.setItem('kbee_last_receipt_url', verification.receipt_url);
    } catch {}

    if (verification?.customer_is_guest === false && user) {
      toast.success('Payment verified. Your order is ready.');
      router.replace('/orders');
    } else {
      toast.success('Order placed successfully.');
      const params = new URLSearchParams();
      if (orderCode) params.set('code', orderCode);
      if (verification?.receipt_url) params.set('receipt', verification.receipt_url);
      router.replace(`/checkout/success${params.toString() ? `?${params.toString()}` : ''}`);
    }
    router.refresh();
  };

  // Poll /verify/:tx_ref until success (or timeout)
  const pollVerify = async (ref: string): Promise<VerifyResp | null> => {
    setVerifying(true);
    const headers = buildHeaders();
    const start = Date.now();
    const timeoutMs = 2 * 60 * 1000;
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    while (Date.now() - start < timeoutMs) {
      try {
        // 200 on success; 202/400 are “not yet”
        const v = await http<VerifyResp>(
          `/api/payments/verify/${ref}/`,
          { headers, allowGuest: allowGuestRequests }
        );
        const ps = (v.payment_status || '').toLowerCase();
        if (ps === 'successful' || ps === 'success') {
          setVerifying(false);
          return v;
        }
      } catch {
        // treat as pending and retry
      }
      await delay(5000);
    }
    setVerifying(false);
    return null;
  };

  const verifyAndGoToOrders = async (ref: string, pendingMessage: string, failureMessage: string) => {
    autoVerifyRef.current = ref;
    setPaymentMessage(pendingMessage);
    setProcessingPayment(true);
    const verification = await pollVerify(ref);
    if (verification) {
      finishVerifiedPayment(verification);
      return;
    }
    autoVerifyRef.current = null;
    setProcessingPayment(false);
    toast.error(failureMessage);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const callbackRef =
      searchParams.get('reference') ||
      searchParams.get('trxref') ||
      searchParams.get('tx_ref') ||
      '';
    if (!callbackRef || autoVerifyRef.current === callbackRef) return;

    const params = new URLSearchParams();
    params.set('reference', callbackRef);
    router.replace(`/checkout/success?${params.toString()}`);
  }, [searchParams, router]);

  /* ---------- actions ---------- */
  const handlePaystackCheckout = async (preferredChannel: 'mobile_money' | 'card') => {
    try {
      if (paymentLocked) return;
      if (user && (!hasHydrated || !authReady)) throw new Error('Please wait while your account is prepared.');
      if (!cart?.items?.length) throw new Error('Your cart is empty.');
      const checkoutAddressId = await ensureCheckoutAddress();

      setPaymentLocked(true);
      setInitializing(true);
      const headers = buildHeaders();
      const init = await http<InitResp>('/api/payments/initialize_checkout_from_cart/', {
        method: 'POST',
        headers,
        allowGuest: allowGuestRequests,
        body: {
          address_id: checkoutAddressId,
          note: note || '',
          shipping_town_id: shippingTownId,
          currency: 'GHS',
          preferred_channel: preferredChannel,
          email: (cardEmail || me.email || guestEmail || '').trim() || undefined,
        },
      });
      setInitializing(false);

      const ref = init.tx_ref;
      if (preferredChannel === 'mobile_money') {
        setMomoRef(ref);
      } else {
        setCardRef(ref);
      }
      try {
        localStorage.setItem(preferredChannel === 'mobile_money' ? 'kbee_momo_tx_ref' : 'kbee_card_tx_ref', ref);
      } catch {}

      const nextUrl =
        init?.next_url ||
        init?.gateway?.data?.authorization_url ||
        init?.gateway?.data?.authorizationURL ||
        init?.gateway?.data?.redirecturl ||
        init?.gateway?.data?.redirect_url ||
        init?.gateway?.data?.url ||
        null;

      if (preferredChannel === 'mobile_money') {
        setMomoNextUrl(nextUrl);
      } else {
        setCardAuthUrl(nextUrl);
      }

      if (!nextUrl) {
        toast.error('Could not open Paystack checkout.');
        setPaymentLocked(false);
        return;
      }

      window.location.href = String(nextUrl);
    } catch (err) {
      setInitializing(false);
      setVerifying(false);
      setProcessingPayment(false);
      setPaymentLocked(false);
      if (err instanceof ApiError) {
        const d: any = err.data || {};
        const fieldErr =
          d.detail ||
          d.address_id?.[0] ||
          d.shipping_fee?.[0] ||
          d.currency?.[0] ||
          d.non_field_errors?.[0];
        toast.error(fieldErr || 'Could not start Paystack checkout.');
      } else {
        toast.error((err as Error)?.message || 'Could not start Paystack checkout.');
      }
    }
  };

  const handlePayMoMo = () => handlePaystackCheckout('mobile_money');

  const handlePayCard = async () => {
    await handlePaystackCheckout('card');
  };

  const switchPaymentMethod = (method: 'momo' | 'card') => {
    if (paymentLocked) return;
    setPayMethod(method);
    setProcessingPayment(false);
    setInitializing(false);
    setVerifying(false);
    setMomoNextUrl(null);
    setCardAuthUrl(null);
    setMomoRef(null);
    setCardRef(null);
  };

  const momoBtnDisabled =
    paymentLocked || initializing || verifying || !cart || !cart.items?.length || !shippingTownId;

  if (processingPayment) {
    return (
      <main className="min-h-[70vh] bg-white px-4 py-16">
        <section className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="relative mb-5 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/25" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-amber-600" />
            <div className="absolute inset-4 rounded-full bg-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Processing payment</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">{paymentMessage}</p>
          <p className="mt-2 text-xs text-gray-500">
            Please keep this page open. You will be redirected to your orders once payment is confirmed.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      {/* ===== Order summary ===== */}
      <section className="mb-6 rounded border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Order summary</h2>
        </div>

        {loadingCart ? (
          <p className="text-sm text-gray-600">Loading cart…</p>
        ) : !cart?.items?.length ? (
          <p className="text-sm text-gray-600">
            Your cart is empty.{' '}
            <Link href="/shop" className="text-indigo-600 underline">
              Shop now
            </Link>
          </p>
        ) : (
          <>
            <ul className="mb-4 space-y-1 text-sm">
              {cart.items.map((it) => (
                <li key={String(it.id)} className="flex items-center justify-between">
                  <span>
                    {it.product?.name ?? 'Item'} × {toNum(it.quantity)}
                  </span>
                  <span>GHS {(toNum(it.unit_price) * toNum(it.quantity)).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">GHS {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Fee</span>
                <span className="font-medium">GHS {shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Charge </span>
                <span className="font-medium">GHS {paymentCharge.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">GHS {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ===== Address & notes ===== */}
      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 font-semibold">Delivery address</h2>

          {!user ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="guestEmail">Email for receipt</Label>
                <Input id="guestEmail" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="guestName">Full name</Label>
                <Input id="guestName" value={guestAddress.full_name} onChange={(e) => setGuestAddress((a) => ({ ...a, full_name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="guestLine1">Address</Label>
                <Input id="guestLine1" value={guestAddress.line1} onChange={(e) => setGuestAddress((a) => ({ ...a, line1: e.target.value }))} />
              </div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Add a delivery address for this order.</p>
              <div>
                <Label htmlFor="guestName">Full name</Label>
                <Input id="guestName" value={guestAddress.full_name} onChange={(e) => setGuestAddress((a) => ({ ...a, full_name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="guestLine1">Address</Label>
                <Input id="guestLine1" value={guestAddress.line1} onChange={(e) => setGuestAddress((a) => ({ ...a, line1: e.target.value }))} />
              </div>
            </div>
          ) : (
            <>
              <Label htmlFor="addr">Choose address</Label>
              <select
                id="addr"
                className="mt-1 w-full rounded border px-3 py-2"
                value={addressId || ''}
                onChange={(e) => setAddressId(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select…
                </option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {(a.full_name || 'Recipient')} — {a.line1}, {a.city || ''}
                    {a.region ? `, ${a.region}` : ''}
                    {a.is_default ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </>
          )}

          {user && addresses.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="customerName">Full name</Label>
                <Input
                  id="customerName"
                  value={guestAddress.full_name}
                  onChange={(e) => setGuestAddress((a) => ({ ...a, full_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone number</Label>
                <Input
                  id="customerPhone"
                  placeholder="Phone number for delivery calls"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {(!user || addresses.length === 0) ? (
            <div className="mt-4">
              <Label htmlFor="customerPhone">Phone number</Label>
              <Input
                id="customerPhone"
                placeholder="Phone number for delivery calls"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="shippingRegion">Delivery region</Label>
              <select
                id="shippingRegion"
                className="mt-1 w-full rounded border px-3 py-2"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="">Select region…</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.slug}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="shippingTown">Delivery town</Label>
              <select
                id="shippingTown"
                className="mt-1 w-full rounded border px-3 py-2"
                value={shippingTownId || ''}
                onChange={(e) => setShippingTownId(e.target.value ? Number(e.target.value) : '')}
                disabled={!selectedRegion}
              >
                <option value="">Select town…</option>
                {towns.map((town) => (
                  <option key={town.id} value={town.id}>
                    {town.name} - GHS {Number(town.fee).toFixed(2)}
                  </option>
                ))}
              </select>
              {selectedRegion && towns.length === 0 ? (
                <p className="mt-1 text-xs text-red-600">
                  No towns have been added for this region yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="note">Order notes (optional)</Label>
            <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {/* Amount to Pay: final total & disabled */}
          <div className="mt-4">
            <Label htmlFor="amountToPay">Amount to Pay (GHS)</Label>
            <Input id="amountToPay" value={grandTotal.toFixed(2)} disabled />
            <p className="mt-1 text-xs text-gray-500">
              Calculated as subtotal + shipping fee + charge.
            </p>
          </div>
        </div>

        {/* ===== Payment ===== */}
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 font-semibold">Payment</h2>

          {/* Method Switcher */}
          <div className="mb-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Payment method">
            <button
              aria-selected={payMethod === 'momo'}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                payMethod === 'momo' ? 'border-amber-600 bg-slate-50 text-amber-800' : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => switchPaymentMethod('momo')}
              role="tab"
              type="button"
            >
              Mobile Money
            </button>
            <button
              aria-selected={payMethod === 'card'}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                payMethod === 'card' ? 'border-amber-600 bg-slate-50 text-amber-800' : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => switchPaymentMethod('card')}
              role="tab"
              type="button"
            >
              Credit / Debit Card
            </button>
          </div>

          {payMethod === 'momo' ? (
            <>
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Mobile Money</div>
                <p className="mt-1 text-sm text-gray-600">
                  Proceed to Pay to choose your mobile money provider and enter your MoMo number securely.
                </p>
              </div>

              <Button
                className="w-full bg-amber-600 text-white hover:bg-amber-700"
                onClick={handlePayMoMo}
                disabled={momoBtnDisabled}
              >
                {initializing || paymentLocked ? 'Opening Payment§§§§§...' : verifying ? 'Waiting for approval...' : 'Proceed to Pay'}
              </Button>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Credit / Debit Card</div>
                <p className="mt-1 text-sm text-gray-600">
                  Proceed to Pay to enter your card details securely.
                </p>
              </div>

              <div className="mb-3">
                <Label htmlFor="cardEmail">Email for receipt</Label>
                <Input
                  id="cardEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={cardEmail || me.email || ''}
                  onChange={(e) => setCardEmail(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  We’ll open a secure Paystack page to collect your card details.
                </p>
              </div>

              <Button
                className="w-full bg-amber-600 text-white hover:bg-amber-700"
                onClick={handlePayCard}
                disabled={paymentLocked || initializing || verifying || !cart || !cart.items?.length || !shippingTownId}
              >
                {initializing || paymentLocked ? 'Opening secure checkout...' : 'Proceed to Pay'}
              </Button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
