'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Clock3, PackageCheck, ReceiptText, ShieldCheck, Truck, XCircle } from 'lucide-react';
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
  const firebaseUid = uid == null ? '' : String(uid);
  if (firebaseUid && !firebaseUid.startsWith('customer:')) h['X-Firebase-UID'] = firebaseUid;
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
  receipt_url?: string | null;
  receipt_generated_at?: string | null;
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
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '');

const trackingSteps = [
  {
    key: 'paid',
    title: 'Payment confirmed',
    description: 'Your payment has been received and the order is queued for processing.',
    icon: ShieldCheck,
  },
  {
    key: 'packaged',
    title: 'Order packaged',
    description: 'Your item is being checked, packed, and prepared for dispatch.',
    icon: PackageCheck,
  },
  {
    key: 'shipped',
    title: 'Out for delivery',
    description: 'Your order has left our store and is on the way to your location.',
    icon: Truck,
  },
  {
    key: 'delivered',
    title: 'Delivered',
    description: 'The order has been delivered successfully.',
    icon: CheckCircle2,
  },
] as const;

const trackingRank: Record<string, number> = {
  pending: -1,
  unpaid: -1,
  processing: 0,
  paid: 0,
  packaged: 1,
  shipped: 2,
  delivered: 3,
};

const statusLabel = (status?: string | null) => {
  const value = (status || '').replace(/[-_]/g, ' ').trim();
  return value ? value.replace(/\b\w/g, (ch) => ch.toUpperCase()) : 'Pending';
};

const statusBadgeClass = (status?: string | null) => {
  const key = (status || '').toLowerCase();
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700 ring-gray-200',
    unpaid: 'bg-gray-100 text-gray-700 ring-gray-200',
    processing: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    packaged: 'bg-slate-50 text-slate-800 ring-slate-100',
    shipped: 'bg-amber-50 text-amber-700 ring-amber-100',
    delivered: 'bg-green-50 text-green-700 ring-green-100',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-100',
    failed: 'bg-rose-50 text-rose-700 ring-rose-100',
  };
  return map[key] || 'bg-gray-100 text-gray-700 ring-gray-200';
};

export default function OrderDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const idOrCode = Array.isArray(idParam) ? idParam[0] : idParam;

  const router = useRouter();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

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

  const downloadReceipt = async () => {
    if (!order?.code) return;
    setDownloadingReceipt(true);
    try {
      const url = `${API_BASE}/api/orders/receipt/${encodeURIComponent(order.code)}/download/`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Receipt download failed.');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `kbee-receipt-${order.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Could not download receipt.');
    } finally {
      setDownloadingReceipt(false);
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

  const displayCode = order?.code || (order ? `Order ID ${order.id}` : '');
  const hasReceipt = Boolean(order?.code || order?.receipt_url);

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

  const TrackingRoadmap = () => {
    if (!order) return null;

    const statusKey = (order.status || '').toLowerCase();
    const isStopped = ['failed', 'cancelled'].includes(statusKey);
    const isDelivered = statusKey === 'delivered';
    const currentRank = trackingRank[statusKey] ?? -1;
    const currentStepTitle =
      isStopped
        ? statusLabel(order.status)
        : currentRank < 0
        ? 'Awaiting payment confirmation'
        : trackingSteps[currentRank]?.title || statusLabel(order.status);

    return (
      <section className="mb-6 overflow-hidden rounded border bg-white">
        <div className="border-b px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-gray-500">Order tracking</div>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">{currentStepTitle}</h2>
              <p className="mt-1 text-sm text-gray-600">
                Last updated {fmtDate(order.updated_at || order.created_at)}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(order.status)}`}
            >
              {statusLabel(order.status)}
            </span>
          </div>
        </div>

        {isStopped ? (
          <div className="flex gap-3 px-4 py-5 sm:px-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                This order is {statusLabel(order.status).toLowerCase()}.
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Please contact support if you need help with this order or payment.
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 sm:px-5">
            <div className="grid gap-5 md:grid-cols-4 md:gap-3">
              {trackingSteps.map((step, index) => {
                const Icon = step.icon;
                const done = currentRank >= index;
                const current = !isDelivered && currentRank === index;
                const waiting = currentRank < index;
                const completeClass = isDelivered
                  ? 'bg-green-600 text-white ring-green-100'
                  : 'bg-amber-600 text-white ring-amber-50';
                const connectorClass = currentRank > index
                  ? isDelivered
                    ? 'bg-green-600'
                    : 'bg-amber-600'
                  : 'bg-gray-200';

                return (
                  <div key={step.key} className="relative flex gap-3 md:block">
                    {index < trackingSteps.length - 1 ? (
                      <>
                        <div
                          className={`absolute left-5 top-10 h-[calc(100%+0.75rem)] w-px md:left-[calc(50%+1.25rem)] md:top-5 md:h-px md:w-[calc(100%-2.5rem)] ${
                            connectorClass
                          }`}
                        />
                      </>
                    ) : null}

                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 md:mx-auto ${
                        done
                          ? completeClass
                          : 'bg-white text-gray-400 ring-gray-100'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>

                    <div className="min-w-0 md:mt-3 md:text-center">
                      <div
                        className={`text-sm font-semibold ${
                          done ? 'text-gray-950' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{step.description}</p>
                      {current ? (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-amber-800">
                          <Clock3 className="h-3.5 w-3.5" />
                          Current step
                        </div>
                      ) : waiting ? (
                        <div className="mt-2 text-xs text-gray-400">Upcoming</div>
                      ) : (
                        <div className="mt-2 text-xs font-medium text-green-700">Completed</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Order {displayCode}</h1>
        <div className="flex flex-wrap gap-2">
          {hasReceipt ? (
            <Button
              type="button"
              onClick={downloadReceipt}
              disabled={downloadingReceipt}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <ReceiptText className="mr-2 h-4 w-4" />
              {downloadingReceipt ? 'Downloading...' : 'Receipt'}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => loadOrder()}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            Refresh
          </Button>
          <Button asChild className="bg-gray-900 text-white hover:bg-gray-700">
            <Link href="/orders">Back to orders</Link>
          </Button>
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
                <div className="font-medium">{statusLabel(order.status)}</div>
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

          <TrackingRoadmap />

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
