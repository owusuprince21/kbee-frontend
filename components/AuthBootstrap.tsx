'use client';
import { useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, clearLegacyAuthStorage, configurePrivateAuthPersistence } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { clearGuestId, getStoredGuestId, http } from '@/lib/api/http';
import type { User } from '@/lib/types';

function userFromCustomer(customer: any): User {
  return {
    id: `customer:${customer.id}`,
    email: customer.email || '',
    displayName: customer.full_name || '',
    photoURL: customer.photo_url || '',
  };
}

async function syncFirebaseCustomer(firebaseUser: FirebaseUser, customerPayload: Record<string, string>) {
  const token = await firebaseUser.getIdToken();
  const guestId = getStoredGuestId();
  return http('/api/customers/me/', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(guestId ? { 'X-Guest-ID': guestId } : {}),
    },
    allowGuest: false,
    body: customerPayload,
  });
}

export default function AuthBootstrap() {
  const { hasHydrated, setUser, setToken, setAuthReady } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    let unsubscribe: (() => void) | undefined;
    let active = true;
    setAuthReady(false);

    configurePrivateAuthPersistence()
      .then(() => clearLegacyAuthStorage())
      .catch(() => clearLegacyAuthStorage())
      .finally(() => {
        if (!active) return;

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            try {
              const sessionCustomer = await http('/api/customers/session/');
              if (!active) return;
              setUser(userFromCustomer(sessionCustomer));
              setToken(null);
              clearGuestId();
            } catch {
              if (!active) return;
              // Firebase is intentionally memory-only, so after a hard refresh
              // the backend session or the safe persisted customer is the source
              // of truth. Do not clear it unless the user explicitly logs out.
              setUser(useAuthStore.getState().user);
              setToken(null);
            } finally {
              if (active) setAuthReady(true);
            }
            return;
          }

          try {
            const payload = {
              email: firebaseUser.email || '',
              full_name: firebaseUser.displayName || '',
              photo_url: firebaseUser.photoURL || '',
            };
            const customer = await syncFirebaseCustomer(firebaseUser, payload);
            if (!active) return;
            setUser(userFromCustomer(customer));
            setToken(null);
            clearGuestId();
            setAuthReady(true);
            window.dispatchEvent(new Event('cart:updated'));
            window.dispatchEvent(new Event('wishlist:updated'));
          } catch {
            if (!active) return;
            setUser(null);
            setToken(null);
            setAuthReady(true);
          }
        });
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [hasHydrated, setAuthReady, setToken, setUser]);

  return null;
}
