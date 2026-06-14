'use client';
import { useEffect } from 'react';
import { browserLocalPersistence, onAuthStateChanged, setPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { http } from '@/lib/api/http';

export default function AuthBootstrap() {
  const { setUser, setToken, logout } = useAuthStore();

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        logout();
        return;
      }
      const token = await firebaseUser.getIdToken();
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
      });
      setToken(token);
      http('/api/customers/me/', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Firebase-UID': firebaseUser.uid,
          'X-User-Email': firebaseUser.email || '',
          'X-User-Name': firebaseUser.displayName || '',
          'X-User-Photo': firebaseUser.photoURL || '',
        },
        body: {
          email: firebaseUser.email || '',
          full_name: firebaseUser.displayName || '',
          photo_url: firebaseUser.photoURL || '',
        },
      })
        .then(() => {
          window.dispatchEvent(new Event('cart:updated'));
          window.dispatchEvent(new Event('wishlist:updated'));
        })
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [logout, setToken, setUser]);

  return null;
}
