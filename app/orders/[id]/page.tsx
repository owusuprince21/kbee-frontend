'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { http } from '@/lib/api/http';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

/* ---------- identity helpers (same pattern as checkout) ---------- */
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
type OrderItem = {
  id?: number | string;
  product?: { name?: string; slug?: string } | null;
  product_name?: string | null;
  product_slug?: string | null;
  image_url?: string | null;
  quantity?: number;
  unit_price?: number | string;
};
type Order = {
  id: number;
  code?: string | null;
  status: string;
  currency?: string | null;
  subtotal?: string | number | null;
  shipping?: string | number | null;
  total?: string | number | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  ship_full_name?: string | null;
  ship_phone?: string | null;
  ship_line1?: string | null;
  ship_line2?: string | null;
  ship_city?: string | null;
  ship_region?: string | null;
  ship_postal?: string | null;
  ship_country?: string | null;
  items?: OrderItem[];
};

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n: unknown, ccy?: string | null) =>
  `${ccy || 'GHS'} ${toNum(n).toFixed(2)}`;
const fmtDate = (s?: string | null) =>
  !s ? '—' : new Date(s).toLocaleString();

export default function OrderDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const idOrCode = Array.isArray(idParam) ? idParam[0] : idParam;

  const router = useRouter();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const canAutoRefresh = useMemo(() => {
    const s = order?.status?.toLowerCase?.() || '';
    return ['pending', 'processing', 'unpaid'].includes(s);
  }, [order]);

  // Guard unauthenticated
  useEffect(() => {
    if (!user) {
      router.replace('/');
      router.refresh();
    }
  }, [user, router]);

  const loadOrder = async () => {
    if (!user) return;
    if (!idOrCode || idOrCode === 'undefined') {
      toast.error('Invalid order link.');
      router.replace('/orders');
      return;
    }
    setLoading(true);
    setFetchErr(null);
    try {
      const headers = buildFirebaseHeaders(user);
      const res = await http<Order>(
        `/api/orders/${encodeURIComponent(idOrCode)}/`,
        { headers }
      );
      setOrder(res);
    } catch (e: any) {
      setOrder(null);
      setFetchErr('Order not found.');
      toast.error('Order not found.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, idOrCode]);

  // Auto-refresh while pending-ish
  useEffect(() => {
    if (!canAutoRefresh) return;
    const id = setInterval(() => loadOrder(), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAutoRefresh]);

  if (!user) return null;

  const displayCode = order?.code || (order ? `ORD-${order.id}` : '');

  const AddressBlock = () => (
    <div className="grid gap-1 text-sm">
      <div className="font-medium">{order?.ship_full_name || '—'}</div>
      <div>{order?.ship_phone || '—'}</div>
      <div>
        {order?.ship_line1 || '—'}
        {order?.ship_line2 ? `, ${order.ship_line2}` : ''}
      </div>
      <div>
        {[order?.ship_city, order?.ship_region, order?.ship_postal]
          .filter(Boolean)
          .join(', ') || '—'}
      </div>
      <div>{order?.ship_country || '—'}</div>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Order {displayCode}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadOrder()}>Refresh</Button>
          <Link href="/orders" className="text-indigo-600 underline self-center">Back to orders</Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">Loading…</div>
      ) : fetchErr || !order ? (
        <div className="rounded border bg-white p-4 text-sm">
          <p className="mb-2 font-medium text-red-600">Order not found.</p>
          <Link href="/orders" className="text-indigo-600 underline">Go back to your orders</Link>
        </div>
      ) : (
        <>
          {/* Summary */}
          <section className="mb-6 rounded border bg-white p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-gray-600">Placed</div>
                <div className="font-medium">{fmtDate(order.created_at)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-medium">{order.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Currency</div>
                <div className="font-medium">{order.currency || 'GHS'}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-gray-600">Subtotal</div>
                <div className="font-medium">{money(order.subtotal, order.currency)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Shipping</div>
                <div className="font-medium">{money(order.shipping, order.currency)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="font-semibold">{money(order.total ?? order.subtotal, order.currency)}</div>
              </div>
            </div>

            {order.notes ? (
              <div className="mt-4">
                <div className="text-sm text-gray-600">Notes</div>
                <div className="text-sm">{order.notes}</div>
              </div>
            ) : null}
          </section>

          {/* Address */}
          <section className="mb-6 rounded border bg-white p-4">
            <div className="mb-2 text-sm font-medium text-gray-600">Shipping Address</div>
            <AddressBlock />
          </section>

          {/* Items */}
          <section className="rounded border bg-white">
            <div className="border-b px-4 py-3 text-sm font-medium text-gray-600">Items</div>
            {(order.items?.length ?? 0) === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-600">No items.</div>
            ) : (
              <div className="divide-y">
                {order.items!.map((it) => {
                  const name = it.product_name || it.product?.name || 'Item';
                  const qty = it.quantity ?? 1;
                  const lineTotal = toNum(it.unit_price) * qty;
                  return (
                    <div
                      key={String(it.id ?? `${name}-${qty}`)}
                      className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                    >
                      <div className="col-span-7 truncate">
                        {name}
                        {it.product_slug ? (
                          <>
                            {' '}
                            <Link
                              href={`/product/${it.product_slug}`}
                              className="text-indigo-600 underline"
                            >
                              view
                            </Link>
                          </>
                        ) : null}
                      </div>
                      <div className="col-span-2">× {qty}</div>
                      <div className="col-span-3 text-right">
                        {money(lineTotal, order.currency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
