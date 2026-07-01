'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { http, ApiError, type Paginated } from '@/lib/api/http';
import { useAuthStore } from '@/store/authStore';
import { auth, signOut } from '@/lib/firebase';

/* -------------------------- helpers / identity -------------------------- */

type AnyRec = Record<string, any>;

function extractUserIdentity(u: unknown): {
  uid: string | number | null;
  email: string | null;
  name: string | null;
  photo: string | null;
} {
  const anyU = (u || {}) as AnyRec;
  const uid = anyU.uid ?? anyU.id ?? anyU.firebase_uid ?? null;
  const email = anyU.email ?? null;
  const name = anyU.displayName ?? anyU.full_name ?? anyU.name ?? null;
  const photo = anyU.photoURL ?? anyU.photo_url ?? null;
  return {
    uid: uid == null ? null : uid,
    email: email == null ? null : String(email),
    name: name == null ? null : String(name),
    photo: photo == null ? null : String(photo),
  };
}

function buildFirebaseHeaders(user: unknown): HeadersInit {
  const { uid, email, name, photo } = extractUserIdentity(user);
  const h: Record<string, string> = {};
  const firebaseUid = uid == null ? '' : String(uid);
  if (firebaseUid && !firebaseUid.startsWith('customer:')) h['X-Firebase-UID'] = firebaseUid;
  if (email) h['X-User-Email'] = email;
  if (name) h['X-User-Name'] = name;
  if (photo) h['X-User-Photo'] = photo;
  return h;
}

/* --------------------------------- types -------------------------------- */

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
  id: number | string;
  code?: string | null;
  status?: string;
  total?: string | number;
  subtotal?: string | number;
  currency?: string | null;
  created_at?: string;
  items?: OrderItem[];
};

type Address = {
  id: number | string;
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

type CustomerAccount = {
  full_name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  phone?: string | null;   // merged from AccountDetail by backend
  bio?: string | null;     // merged from AccountDetail by backend
};

/* ------------------------------- utilities ------------------------------ */

const toNum = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (n: unknown, ccy?: string | null) =>
  `${ccy?.toUpperCase() === 'GHS' ? 'GH₵' : ccy || 'GHS'}${toNum(n).toLocaleString()}`;

// Short date like "12/10/25, 20:53"
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

// Status → Tailwind color mapping (matches your Orders page)
const statusBadgeCls = (s?: string) => {
  const k = (s || '').toLowerCase();
  const map: Record<string, string> = {
    pending:     'bg-gray-200 text-gray-800',
    unpaid:      'bg-gray-200 text-gray-800',
    packaged:    'bg-slate-100 text-slate-800',
    processing:  'bg-indigo-100 text-indigo-700',
    paid:        'bg-emerald-100 text-emerald-700',
    completed:   'bg-emerald-100 text-emerald-700',
    shipped:     'bg-amber-100 text-amber-700',
    'in-transit':'bg-amber-100 text-amber-700',
    delivered:   'bg-green-100 text-green-700',
    cancelled:   'bg-rose-100 text-rose-700',
    failed:      'bg-rose-100 text-rose-700',
    refunded:    'bg-slate-100 text-slate-700',
    returned:    'bg-slate-100 text-slate-700',
  };
  return map[k] || 'bg-gray-100 text-gray-700';
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

/* --------------------------------- page --------------------------------- */

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, hasHydrated, authReady } = useAuthStore();
  const me = useMemo(() => extractUserIdentity(user), [user]);

  const [tab, setTab] = useState<'orders' | 'addresses' | 'account'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [account, setAccount] = useState<CustomerAccount>({
    full_name: me.name ?? '',
    email: me.email ?? '',
  });

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersAvailable, setOrdersAvailable] = useState<boolean>(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [addingAddr, setAddingAddr] = useState(false);

  const [addrForm, setAddrForm] = useState<Address>({
    id: 0,
    full_name: me.name ?? '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postal_code: '',
    country: 'Ghana',
    phone: '',
    is_default: false,
  });

  useEffect(() => {
    if (hasHydrated && authReady && !user) {
      router.replace('/signin?next=%2Fprofile');
    }
  }, [hasHydrated, authReady, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const headers = buildFirebaseHeaders(user);

    // Orders
    (async () => {
      try {
        setLoadingOrders(true);
        const res = await http<Order[] | Paginated<Order>>(
          `/api/orders/?page_size=50&ordering=-created_at`,
          { headers }
        );
        const list = unwrapList<Order>(res);
        if (!cancelled) {
          setOrders(list);
          setOrdersAvailable(true);
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setOrdersAvailable(false);
        }
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();

    // Addresses
    (async () => {
      try {
        setLoadingAddresses(true);
        const res = await http<Address[] | Paginated<Address>>(`/api/addresses/`, { headers });
        const list = unwrapList<Address>(res);
        if (!cancelled) setAddresses(list);
      } catch {
        if (!cancelled) setAddresses([]);
      } finally {
        if (!cancelled) setLoadingAddresses(false);
      }
    })();

    // Account (merged customer + phone/bio)
    (async () => {
      try {
        const res = await http<any>(`/api/customers/me/`, { headers }).catch(() => null);
        if (!cancelled && res) {
          setAccount({
            full_name: res.full_name ?? me.name ?? '',
            email: res.email ?? me.email ?? '',
            photo_url: res.photo_url ?? me.photo ?? '',
            phone: res.phone ?? '',
            bio: res.bio ?? '',
          });
        }
      } catch {
        /* ignore */
      }
    })();

    return () => { cancelled = true; };
  }, [user, me.name, me.email, me.photo]);

  if (!hasHydrated || !authReady || !user) return null;

  /* ----------------------------- helpers ---------------------------- */

  const initials = (name?: string | null) =>
    (name || 'U').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    try {
      await http('/api/customers/logout/', { method: 'POST' }).catch(() => null);
      await signOut(auth);
      logout();
      toast.success('Logged out');
    } finally {
      router.replace('/');
      router.refresh();
    }
  };

  const saveAccount = async () => {
    try {
      setSavingAccount(true);
      const headers = buildFirebaseHeaders(user);
      const saved = await http<any>(`/api/customers/me/`, { method: 'PATCH', headers, body: account });
      setAccount((a) => ({
        ...a,
        full_name: saved?.full_name ?? a.full_name ?? '',
        email: saved?.email ?? a.email ?? '',
        photo_url: saved?.photo_url ?? a.photo_url ?? '',
        phone: saved?.phone ?? a.phone ?? '',
        bio: saved?.bio ?? a.bio ?? '',
      }));
      toast.success('Account updated.');
    } catch (err) {
      if (err instanceof ApiError) {
        const msg =
          err.data?.detail ||
          (Array.isArray(err.data?.email) && err.data.email[0]) ||
          (Array.isArray(err.data?.phone) && err.data.phone[0]) ||
          'Could not save account.';
        toast.error(String(msg));
      } else {
        toast.error('Could not save account.');
      }
    } finally {
      setSavingAccount(false);
    }
  };

  const addAddress = async () => {
    if (!addrForm.line1?.trim() || !addrForm.city?.trim()) {
      toast.error('Please fill at least Address line 1 and City.');
      return;
    }
    try {
      setAddingAddr(true);
      const headers = buildFirebaseHeaders(user);
      const created = await http<Address>(`/api/addresses/`, {
        method: 'POST',
        headers,
        body: {
          ...addrForm,
          line1: String(addrForm.line1).trim(),
          line2: String(addrForm.line2 || '').trim() || null,
        },
      });
      setAddresses((prev) => {
        const next = [created, ...prev];
        if (created.is_default) return next.map(a => ({ ...a, is_default: a.id === created.id }));
        return next;
      });
      setAddrForm(f => ({ ...f, line1: '', line2: '', city: '', region: '', postal_code: '', phone: '' }));
      toast.success('Address added.');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.data?.detail || 'Could not add address.');
      } else {
        toast.error('Could not add address.');
      }
    } finally {
      setAddingAddr(false);
    }
  };

  const setDefaultAddress = async (id: number | string) => {
    try {
      const headers = buildFirebaseHeaders(user);
      await http(`/api/addresses/${id}/`, { method: 'PATCH', headers, body: { is_default: true } });
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      toast.success('Default address updated.');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.data?.detail || 'Could not set default address.');
      } else {
        toast.error('Could not set default address.');
      }
    }
  };

  const deleteAddress = async (id: number | string) => {
    try {
      const headers = buildFirebaseHeaders(user);
      await http(`/api/addresses/${id}/`, { method: 'DELETE', headers });
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address removed.');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.data?.detail || 'Could not remove address.');
      } else {
        toast.error('Could not remove address.');
      }
    }
  };

  /* --------------------------------- UI --------------------------------- */

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {me.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.photo}
              alt={me.name || 'Profile photo'}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-500"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gray-200 text-lg font-semibold text-gray-700 ring-2 ring-amber-500">
              {initials(me.name)}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500">Welcome back</p>
            <h1 className="text-2xl font-bold">Hi, {me.name || 'Customer'}!</h1>
            {me.email ? <p className="text-sm text-gray-500">{me.email}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/orders">
            <Button variant="outline">Order History</Button>
          </Link>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="addresses">Delivery Address</TabsTrigger>
          <TabsTrigger value="account">Account Details</TabsTrigger>
        </TabsList>

        {/* Orders (card layout + colored badges) */}
        <TabsContent value="orders">
          {loadingOrders ? (
            <p className="text-sm text-gray-600">Loading orders…</p>
          ) : !ordersAvailable ? (
            <div className="rounded-lg border bg-white p-6 text-center">
              <p className="mb-3 text-gray-600">Orders aren’t available yet. Check back soon.</p>
              <Link href="/shop">
                <Button className="bg-amber-600 text-white hover:bg-amber-700">Go shopping</Button>
              </Link>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-center">
              <p className="mb-3 text-gray-600">You haven’t placed any orders yet.</p>
              <Link href="/shop">
                <Button className="bg-amber-600 text-white hover:bg-amber-700">Go shopping</Button>
              </Link>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((o) => {
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
                  <div key={String(o.id)} className="relative rounded-xl border bg-white p-4">
                    {/* Status badge */}
                    <div
                      className={`absolute right-3 top-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-black/5 ${statusBadgeCls(o.status)}`}
                    >
                      {(o.status || '—').toUpperCase()}
                    </div>

                    {/* Header */}
                    <div className="mb-2 pr-28">
                      <div className="text-lg font-semibold">{o.code || `Order ID ${o.id}`}</div>
                      <div className="text-sm text-gray-500">Placed {fmtDateShort(o.created_at)}</div>
                    </div>

                    {/* Item preview */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                        <img
                          src={first?.image_url || '/placeholder.svg'}
                          alt={name}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover"
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

                    {/* Footer */}
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
        </TabsContent>

        {/* Addresses */}
        <TabsContent value="addresses">
          <AddressesPanel
            addresses={addresses}
            loading={loadingAddresses}
            meName={me.name}
            addrForm={addrForm}
            setAddrForm={setAddrForm}
            onAdd={addAddress}
            onMakeDefault={setDefaultAddress}
            onDelete={deleteAddress}
            adding={addingAddr}
          />
        </TabsContent>

        {/* Account */}
        <TabsContent value="account">
          <AccountPanel
            account={account}
            setAccount={setAccount}
            onSave={saveAccount}
            saving={savingAccount}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ----------------------------- Subcomponents ----------------------------- */

function AddressesPanel(props: {
  addresses: Address[];
  loading: boolean;
  meName?: string | null;
  addrForm: Address;
  setAddrForm: (u: Address | ((p: Address) => Address)) => void;
  onAdd: () => void;
  onMakeDefault: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  adding: boolean;
}) {
  const { addresses, loading, meName, addrForm, setAddrForm, onAdd, onMakeDefault, onDelete, adding } = props;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      {/* List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Saved addresses</h3>
        {loading ? (
          <p className="text-sm text-gray-600">Loading addresses…</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-gray-600">No saved addresses yet — add one on the right.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div key={String(a.id)} className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{a.full_name || meName || 'Recipient'}</p>
                  {a.is_default ? (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Default</span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => onMakeDefault(a.id)}>
                      Make default
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}
                </p>
                <p className="text-sm text-gray-700">
                  {a.city}{a.region ? `, ${a.region}` : ''}{a.postal_code ? ` • ${a.postal_code}` : ''}
                </p>
                <p className="text-sm text-gray-700">
                  {a.country || '—'}{a.phone ? ` • ${a.phone}` : ''}
                </p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={a.is_default && addresses.length === 1}
                    onClick={() => onDelete(a.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Add a new address</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="nm">Full name</Label>
            <Input
              id="nm"
              value={addrForm.full_name ?? ''}
              onChange={(e) => setAddrForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Recipient name"
            />
          </div>
          <div>
            <Label htmlFor="l1">Address line 1</Label>
            <Input
              id="l1"
              value={addrForm.line1}
              onChange={(e) => setAddrForm((f) => ({ ...f, line1: e.target.value }))}
              placeholder="Street, house/apartment"
            />
          </div>
          <div>
            <Label htmlFor="l2">Address line 2 (optional)</Label>
            <Input
              id="l2"
              value={addrForm.line2 ?? ''}
              onChange={(e) => setAddrForm((f) => ({ ...f, line2: e.target.value }))}
              placeholder="Area, landmark"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={addrForm.city ?? ''}
                onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="region">Region/State</Label>
              <Input
                id="region"
                value={addrForm.region ?? ''}
                onChange={(e) => setAddrForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="Region / State"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="zip">Postal code</Label>
              <Input
                id="zip"
                value={addrForm.postal_code ?? ''}
                onChange={(e) => setAddrForm((f) => ({ ...f, postal_code: e.target.value }))}
                placeholder="e.g. GA-123-4567"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={addrForm.country ?? ''}
                onChange={(e) => setAddrForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Country"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ph">Phone</Label>
            <Input
              id="ph"
              value={addrForm.phone ?? ''}
              onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Contact phone"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Make this my default address</p>
              <p className="text-xs text-gray-500">We’ll preselect this at checkout.</p>
            </div>
            <Switch
              checked={Boolean(addrForm.is_default)}
              onCheckedChange={(v) => setAddrForm((f) => ({ ...f, is_default: v }))}
            />
          </div>

          <Button
            onClick={onAdd}
            disabled={adding}
            className="w-full bg-amber-600 text-white hover:bg-amber-700"
          >
            {adding ? 'Adding…' : 'Add address'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccountPanel(props: {
  account: CustomerAccount;
  setAccount: (u: CustomerAccount | ((p: CustomerAccount) => CustomerAccount)) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { account, setAccount, onSave, saving } = props;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Profile</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="fn">Full name</Label>
            <Input
              id="fn"
              value={account.full_name ?? ''}
              onChange={(e) => setAccount((a) => ({ ...a, full_name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div>
            <Label htmlFor="em">Email</Label>
            <Input
              id="em"
              type="email"
              value={account.email ?? ''}
              onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="ph2">Phone</Label>
            <Input
              id="ph2"
              value={account.phone ?? ''}
              onChange={(e) => setAccount((a) => ({ ...a, phone: e.target.value }))}
              placeholder="+233 …"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio / Notes</Label>
            <Textarea
              id="bio"
              value={account.bio ?? ''}
              onChange={(e) => setAccount((a) => ({ ...a, bio: e.target.value }))}
              rows={4}
              placeholder="Anything you'd like us to know for delivery or support."
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">Preferences</h3>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Email me order updates</p>
              <p className="text-xs text-gray-500">We’ll keep you posted about your shipments.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Marketing emails</p>
              <p className="text-xs text-gray-500">Occasional promos and product news.</p>
            </div>
            <Switch />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">Security</h3>
          <p className="text-sm text-gray-600">
            Manage password / 2FA in your authentication provider.
          </p>
          <div className="mt-3">
            <Link href="#">
              <Button variant="outline" disabled>Reset password</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
