// app/checkout/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { http, ApiError, type Paginated } from '@/lib/api/http';
import { useAuthStore } from '@/store/authStore';

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
  if (uid != null) h['X-Firebase-UID'] = String(uid);
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
  channel?: 'mobile_money' | 'card';
  next_url?: string | null;
  gateway: any;
};

/* ---------- utils ---------- */
const toNum = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

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

/* ---------- constants ---------- */
const SHIPPING_FEE_GHS = 50;

/* ---------- page ---------- */
export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const me = useMemo(() => extractUserIdentity(user), [user]);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [addressId, setAddressId] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState<'mtn' | 'airteltigo' | 'telecel' | ''>('');

  const [payMethod, setPayMethod] = useState<'momo' | 'card'>('momo');
  const [cardEmail, setCardEmail] = useState<string>('');

  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Keep refs SEPARATE to avoid mixing MoMo <-> Card
  const [momoRef, setMomoRef] = useState<string | null>(null);
  const [cardRef, setCardRef] = useState<string | null>(null);

  // NEW: Fallback URLs when popup gets blocked
  const [momoNextUrl, setMomoNextUrl] = useState<string | null>(null);
  const [cardAuthUrl, setCardAuthUrl] = useState<string | null>(null);

  // redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.replace('/');
      router.refresh();
    }
  }, [user, router]);

  // helper: refetch server cart
  const fetchServerCart = async (headers: HeadersInit) => {
    const apiRes = await http<any>(`/api/cart/?_=${Date.now()}`, { headers }); // cache-buster
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
    if (!user) return;
    const headers = buildFirebaseHeaders(user);

    (async () => {
      try {
        const res = await http<Address[] | Paginated<Address>>('/api/addresses/', { headers });
        const list = Array.isArray((res as Paginated<Address>)?.results)
          ? (res as Paginated<Address>).results
          : (res as Address[]);
        setAddresses(Array.isArray(list) ? list : []);
        const def =
          (Array.isArray(list) ? list : []).find(a => a.is_default) ||
          (Array.isArray(list) ? list[0] : undefined);
        if (def) {
          setAddressId(def.id);
          setPhone(def.phone || '');
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
  }, [user]);

  // subtotal prefers backend value if present; else sum items
  const subtotal = useMemo(() => {
    if (!cart) return 0;
    if (cart.subtotal != null) return toNum(cart.subtotal);
    return (cart.items ?? []).reduce(
      (acc, it) => acc + toNum(it.unit_price) * toNum(it.quantity || 1),
      0
    );
  }, [cart]);

  const shipping = SHIPPING_FEE_GHS; // fixed
  const grandTotal = subtotal + shipping;

  // auto-fill phone when address changes (if blank)
  useEffect(() => {
    if (!addressId) return;
    const a = addresses.find(x => x.id === addressId);
    if (a && !phone) setPhone(a.phone || '');
  }, [addressId, addresses, phone]);

  /* ---------- server helpers ---------- */
  const buildHeaders = () => buildFirebaseHeaders(user);

  const clearLocalCart = () => {
    try {
      const keys = ['cart', 'cartItems', 'kbee-cart'];
      keys.forEach(k => localStorage.removeItem(k));
    } catch {}
    setCart({ items: [], subtotal: 0 });
  };

  // Poll /verify/:tx_ref until success (or timeout)
  const pollVerify = async (ref: string) => {
    setVerifying(true);
    const headers = buildHeaders();
    const start = Date.now();
    const timeoutMs = 2 * 60 * 1000;
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    while (Date.now() - start < timeoutMs) {
      try {
        // 200 on success; 202/400 are “not yet”
        const v = await http<{ order_status?: string; payment_status?: string; detail?: string }>(
          `/api/payments/verify/${ref}/`,
          { headers }
        );
        const ps = (v.payment_status || '').toLowerCase();
        if (ps === 'successful' || ps === 'success') {
          setVerifying(false);
          return true;
        }
      } catch {
        // treat as pending and retry
      }
      await delay(5000);
    }
    setVerifying(false);
    return false;
  };

  /* ---------- actions ---------- */
  const handlePayMoMo = async () => {
    // Pre-open a blank tab to avoid popup blocking (only used if next_url exists)
    let popup: Window | null = null;
    try {
      popup = window.open('about:blank', '_blank');
      if (popup) {
        popup.opener = null;
        popup.document.write('<p style="font:14px sans-serif;margin:16px">Opening mobile money page…</p>');
      }
    } catch {}

    try {
      if (!cart?.items?.length) throw new Error('Your cart is empty.');
      if (!addressId) throw new Error('Please choose a delivery address.');
      if (!network) throw new Error('Choose a mobile network (MTN/AirtelTigo/Telecel).');
      if (!phone?.trim()) throw new Error('Enter your MoMo phone number.');

      setInitializing(true);
      const headers = buildHeaders();
      const init = await http<InitResp>('/api/payments/initialize_from_cart/', {
        method: 'POST',
        headers,
        body: {
          address_id: addressId,
          note: note || '',
          shipping_fee: SHIPPING_FEE_GHS,
          currency: 'GHS',
          network, // 'mtn' | 'airteltigo' | 'telecel'
          phone_number: phone,
        },
      });
      setInitializing(false);

      const ref = init.tx_ref;
      setMomoRef(ref);

      const nextUrl =
        init?.next_url ||
        init?.gateway?.data?.authorization_url ||
        init?.gateway?.data?.authorizationURL ||
        init?.gateway?.data?.redirecturl ||
        init?.gateway?.data?.redirect_url ||
        init?.gateway?.data?.url ||
        null;

      setMomoNextUrl(nextUrl);

      if (nextUrl) {
        if (popup) {
          popup.location.href = String(nextUrl);
          toast.message('We opened a MoMo page in a new tab. Complete it, then click "Check status".');
        } else {
          toast.message('Your browser blocked the pop-up. Click "Open MoMo Page" below.');
        }
      } else {
        if (popup) try { popup.close(); } catch {}
        toast.message('Payment initiated. Approve the MoMo prompt on your phone, then click "Check status".');
      }
    } catch (err) {
      setInitializing(false);
      setVerifying(false);
      if (popup) try { popup.close(); } catch {}
      if (err instanceof ApiError) {
        const d: any = err.data || {};
        const fieldErr =
          d.detail ||
          d.address_id?.[0] ||
          d.network?.[0] ||
          d.phone_number?.[0] ||
          d.shipping_fee?.[0] ||
          d.currency?.[0] ||
          d.non_field_errors?.[0];
        toast.error(fieldErr || 'Checkout failed.');
      } else {
        toast.error((err as Error)?.message || 'Checkout failed.');
      }
    }
  };

  const handlePayCard = async () => {
    // Pre-open a blank tab to avoid popup blocking
    let popup: Window | null = null;
    try {
      popup = window.open('about:blank', '_blank');
      if (popup) {
        popup.opener = null;
        popup.document.write('<p style="font:14px sans-serif;margin:16px">Opening secure card checkout…</p>');
      }
    } catch {}

    try {
      if (!cart?.items?.length) throw new Error('Your cart is empty.');
      if (!addressId) throw new Error('Please choose a delivery address.');

      setInitializing(true);
      const headers = buildHeaders();
      const init = await http<InitResp>('/api/payments/initialize_card_from_cart/', {
        method: 'POST',
        headers,
        body: {
          address_id: addressId,
          note: note || '',
          shipping_fee: SHIPPING_FEE_GHS,
          currency: 'GHS',
          email: (cardEmail || me.email || '').trim() || undefined,
        },
      });
      setInitializing(false);

      const ref = init.tx_ref;
      setCardRef(ref);

      const authUrl =
        init?.next_url ||
        init?.gateway?.data?.authorization_url ||
        init?.gateway?.data?.authorizationURL ||
        init?.gateway?.authorization_url ||
        null;

      setCardAuthUrl(authUrl);

      if (!authUrl) {
        if (popup) try { popup.close(); } catch {}
        toast.error('Could not start card payment.');
        return;
      }

      if (popup) {
        popup.location.href = String(authUrl);
        toast.message('Opened secure card payment in a new tab. Complete it, then click "Check status".');
      } else {
        toast.message('Your browser blocked the pop-up. Click "Open Card Checkout" below.');
      }
    } catch (err) {
      setInitializing(false);
      if (popup) try { popup.close(); } catch {}
      if (err instanceof ApiError) {
        const d: any = err.data || {};
        const fieldErr =
          d.detail ||
          d.address_id?.[0] ||
          d.shipping_fee?.[0] ||
          d.currency?.[0] ||
          d.non_field_errors?.[0];
        toast.error(fieldErr || 'Could not start card payment.');
      } else {
        toast.error((err as Error)?.message || 'Could not start card payment.');
      }
    }
  };

  if (!user) return null;

  const momoBtnDisabled =
    initializing || verifying || !cart || !cart.items?.length || !addressId || !network || !phone?.trim();

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
                <span className="font-medium">GHS {SHIPPING_FEE_GHS.toFixed(2)}</span>
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

          {addresses.length === 0 ? (
            <p className="text-sm text-gray-600">
              No saved addresses yet. Add one in{' '}
              <Link href="/profile" className="text-indigo-600 underline">
                your profile
              </Link>
              .
            </p>
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

          <div className="mt-4">
            <Label htmlFor="note">Order notes (optional)</Label>
            <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {/* Amount to Pay: final total & disabled */}
          <div className="mt-4">
            <Label htmlFor="amountToPay">Amount to Pay (GHS)</Label>
            <Input id="amountToPay" value={grandTotal.toFixed(2)} disabled />
            <p className="mt-1 text-xs text-gray-500">
              Calculated as Subtotal + Shipping Fee (GHS {SHIPPING_FEE_GHS.toFixed(2)}).
            </p>
          </div>
        </div>

        {/* ===== Payment ===== */}
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 font-semibold">Payment</h2>

          {/* Method Switcher */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                payMethod === 'momo' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setPayMethod('momo')}
              type="button"
            >
              Mobile Money
            </button>
            <button
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                payMethod === 'card' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setPayMethod('card')}
              type="button"
            >
              Credit / Debit Card
            </button>
          </div>

          {payMethod === 'momo' ? (
            <>
              <div className="mb-3">
                <Label htmlFor="net">Network</Label>
                <select
                  id="net"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as any)}
                >
                  <option value="">Select…</option>
                  <option value="mtn">MTN</option>
                  <option value="airteltigo">AirtelTigo</option>
                  <option value="telecel">Telecel (Vodafone)</option>
                </select>
              </div>

              <div className="mb-3">
                <Label htmlFor="ph">MoMo phone number</Label>
                <Input
                  id="ph"
                  placeholder="+233… or 0…"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Button
                className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                onClick={handlePayMoMo}
                disabled={momoBtnDisabled}
              >
                {initializing ? 'Starting payment…' : verifying ? 'Waiting for approval…' : 'Pay with Mobile Money'}
              </Button>

              {/* Fallback open link when popup was blocked */}
              {momoNextUrl ? (
                <div className="mt-3 flex items-center gap-2">
                  <Button asChild className="bg-yellow-500 text-black hover:bg-yellow-600">
                    <a href={momoNextUrl} target="_blank" rel="noopener noreferrer">
                      Open MoMo Page
                    </a>
                  </Button>
                  {momoRef ? (
                    <span className="text-xs text-gray-600">
                      Ref: <code>{momoRef}</code>
                    </span>
                  ) : null}
                </div>
              ) : null}

              {momoRef ? (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-yellow-500 text-yellow-800 hover:bg-yellow-50"
                    onClick={async () => {
                      const ok = await pollVerify(momoRef);
                      if (ok) {
                        clearLocalCart();
                        toast.success('Payment verified ✅');
                        router.replace('/orders');
                        router.refresh();
                      } else {
                        toast.error('Still pending. Complete the MoMo flow and try again.');
                      }
                    }}
                  >
                    {verifying ? 'Checking…' : 'Check status'}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <>
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
                className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                onClick={handlePayCard}
                disabled={initializing || verifying || !cart || !cart.items?.length || !addressId}
              >
                {initializing ? 'Opening secure checkout…' : 'Pay with Card'}
              </Button>

              {/* Fallback open link when popup was blocked */}
              {cardAuthUrl ? (
                <div className="mt-3 flex items-center gap-2">
                  <Button asChild className="bg-yellow-500 text-black hover:bg-yellow-600">
                    <a href={cardAuthUrl} target="_blank" rel="noopener noreferrer">
                      Open Card Checkout
                    </a>
                  </Button>
                  {cardRef ? (
                    <span className="text-xs text-gray-600">
                      Ref: <code>{cardRef}</code>
                    </span>
                  ) : null}
                </div>
              ) : null}

              {cardRef ? (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-yellow-500 text-yellow-800 hover:bg-yellow-50"
                    onClick={async () => {
                      const ok = await pollVerify(cardRef);
                      if (ok) {
                        clearLocalCart();
                        toast.success('Payment verified ✅');
                        router.replace('/orders');
                        router.refresh();
                      } else {
                        toast.error('Still pending. Complete the card payment then try again.');
                      }
                    }}
                  >
                    {verifying ? 'Checking…' : 'Check status'}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
