'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { http, type Paginated } from '@/lib/api/http';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
type OrderItem = {
  id?: number | string;
  product?: { name?: string } | null;
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
  subtotal?: number | string | null;
  shipping?: number | string | null;
  total?: number | string | null;
  created_at?: string | null;
  items?: OrderItem[];
};

/* ---------- utils ---------- */
const toNum = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (n: unknown, ccy?: string | null) =>
  `${ccy?.toUpperCase() === 'GHS' ? 'GH₵' : ccy || 'GHS'}${toNum(n).toLocaleString()}`;
const fmtDateShort = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const HH = String(d.getHours()).padStart(2, '0');
  const MI = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy}, ${HH}:${MI}`;
};
const statusBadgeCls = (s?: string) => {
  const k = (s || '').toLowerCase();
  const map: Record<string, string> = {
    pending: 'bg-gray-200 text-gray-800',
    unpaid: 'bg-gray-200 text-gray-800',
    packaged: 'bg-amber-100 text-amber-800',
    processing: 'bg-indigo-100 text-indigo-700',
    paid: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    shipped: 'bg-blue-100 text-blue-700',
    'in-transit': 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-rose-100 text-rose-700',
    failed: 'bg-rose-100 text-rose-700',
    refunded: 'bg-slate-100 text-slate-700',
    returned: 'bg-slate-100 text-slate-700',
  };
  return map[k] || 'bg-gray-100 text-gray-700';
};

/* ---------- page ---------- */
export default function OrdersPage() {
  const { user } = useAuthStore();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<
    'all' | 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'packaged' | 'shipped' | 'delivered'
  >('all');
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  const fetchOrders = async (url?: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = buildFirebaseHeaders(user);
      const res = await http<Order[] | Paginated<Order>>(url || '/api/orders/', { headers });
      const list = Array.isArray((res as Paginated<Order>)?.results)
        ? (res as Paginated<Order>).results
        : (res as Order[]);
      setOrders(Array.isArray(list) ? list : []);
      if (Array.isArray(res)) {
        setNextUrl(null);
        setPrevUrl(null);
      } else {
        setNextUrl((res as Paginated<Order>).next ?? null);
        setPrevUrl((res as Paginated<Order>).previous ?? null);
      }
    } catch {
      setOrders([]);
      setNextUrl(null);
      setPrevUrl(null);
      toast.error('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && user) void fetchOrders();
  }, [hydrated, user]);

  useEffect(() => {
    const needsRefresh = orders.some(o =>
      ['pending', 'processing', 'unpaid', 'packaged'].includes(o.status?.toLowerCase?.() || '')
    );
    if (!needsRefresh || !user) return;
    const id = setInterval(() => fetchOrders(), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, user]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      const code = (o.code || `ORD-${o.id}`).toLowerCase();
      const matchesQ =
        !needle ||
        code.includes(needle) ||
        (o.items || []).some(i =>
          (i.product?.name || i.product_name || '').toLowerCase().includes(needle)
        );
      const matchesStatus = status === 'all' || o.status?.toLowerCase?.() === status;
      return matchesQ && matchesStatus;
    });
  }, [orders, q, status]);

  return (
    <main className="container mx-auto px-4 py-10">
      {/* HEADER: mobile stacks -> Search on first row, then Status + Refresh underneath */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Your Orders</h1>

        <div className="w-full sm:w-auto">
          {/* Mobile: grid → search first row; second row has status + refresh side-by-side */}
          <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
            <Input
              placeholder="Search code or product…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-56"
            />

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <select
                className="w-full rounded border px-3 py-2 sm:w-44"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="packaged">Packaged</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>

              <Button
                variant="outline"
                onClick={() => fetchOrders()}
                disabled={!user || loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {hydrated && !user ? (
        <div className="rounded border bg-white p-4 text-sm">
          <p className="mb-2">You need to sign in to view your orders.</p>
          <Link href="/profile" className="text-indigo-600 underline">Go to profile</Link>
        </div>
      ) : loading ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          No orders found. <Link href="/shop" className="text-indigo-600 underline">Shop now</Link>.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => {
            const first = o.items?.[0];
            const name = first?.product?.name || first?.product_name || 'Item';
            const qty = first?.quantity ?? 1;
            const lineTotal = toNum(first?.unit_price) * qty;
            const href =
              (o as any).id != null
                ? `/orders/${(o as any).id}`
                : o.code
                ? `/orders/${encodeURIComponent(o.code)}`
                : '';

            return (
              <div key={o.id} className="relative rounded-xl border bg-white p-4">
                <div
                  className={`absolute right-3 top-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-black/5 ${statusBadgeCls(o.status)}`}
                >
                  {o.status?.toUpperCase?.() || '—'}
                </div>

                <div className="mb-2 pr-28">
                  <div className="text-lg font-semibold">Order #{o.id}</div>
                  <div className="text-sm text-gray-500">Placed {fmtDateShort(o.created_at)}</div>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                    <img
                      src={first?.image_url || '/placeholder.svg'}
                      alt={name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="max-w-[220px] truncate font-medium" title={name}>
                      {name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Qty {qty} · {money(lineTotal, o.currency)}
                      {o.items && o.items.length > 1 ? (
                        <span className="ml-1">+{o.items.length - 1} more</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Total:&nbsp;</span>
                    <span className="font-semibold">
                      {money(o.total ?? o.subtotal, o.currency)}
                    </span>
                  </div>

                  {href ? (
                    <Link
                      href={href}
                      className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      Order details
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-lg border px-3 py-2 text-sm text-gray-400">
                      Order details
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {(prevUrl || nextUrl) && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" disabled={!prevUrl} onClick={() => fetchOrders(prevUrl!)}>
            Previous
          </Button>
          <Button variant="outline" disabled={!nextUrl} onClick={() => fetchOrders(nextUrl!)}>
            Next
          </Button>
        </div>
      )}
    </main>
  );
}
