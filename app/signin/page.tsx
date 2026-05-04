'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, provider } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

function isSafariOrIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS || isSafari;
}

function mapFirebaseError(code?: string) {
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Switching to redirect…';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Auth.';
    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/cookie-not-found':
      return 'This browser blocks popups/cookies. Using redirect…';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is disabled in Firebase.';
    default:
      return 'Failed to sign in. Please try again.';
  }
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => searchParams.get('next') || '/', [searchParams]);

  const { setUser, setToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Finish sign-in whenever Firebase auth state changes (works for redirect & popup)
  useEffect(() => {
    // Make sure we persist across refreshes
    setPersistence(auth, browserLocalPersistence).catch(() => { /* ignore */ });

    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setInitializing(false);
          return;
        }
        const token = await u.getIdToken();
        setUser({
          id: u.uid,
          email: u.email || '',
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
        });
        setToken(token);
        toast.success('Signed in successfully!');
        router.replace(nextUrl);
      } catch (err) {
        // If something goes wrong here, still allow the UI
        setInitializing(false);
      }
    });

    // Optional: encourage account picker each time
    try {
      provider.setCustomParameters({ prompt: 'select_account' });
    } catch {}

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithPopupOrRedirect = async () => {
    setLoading(true);
    const preferRedirect = isSafariOrIOS();

    try {
      if (preferRedirect) {
        toast.message('Redirecting to Google…');
        await signInWithRedirect(auth, provider);
        return;
      }
      // Try popup first on desktop Chrome/Edge/Firefox
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      const msg = mapFirebaseError(err?.code);
      // If popup fails (blocked), try redirect automatically
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/operation-not-supported-in-this-environment' ||
        err?.code === 'auth/cookie-not-found'
      ) {
        toast.message(msg);
        await signInWithRedirect(auth, provider);
        return;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithRedirectOnly = async () => {
    setLoading(true);
    try {
      toast.message('Redirecting to Google…');
      await signInWithRedirect(auth, provider);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[80dvh] place-items-center px-4 py-10 sm:py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 overflow-hidden rounded-full ring-1 ring-yellow-500/30">
            <Image
              src="/logo.png"
              alt="Kbee Computers"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Kbee Computers account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={signInWithPopupOrRedirect}
            disabled={loading || initializing}
            aria-busy={loading || initializing}
            className="w-full border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading || initializing ? 'Preparing…' : 'Continue with Google'}
          </Button>

          {/* Optional explicit redirect-only button for stubborn browsers */}
          {/* <Button
            variant="outline"
            onClick={signInWithRedirectOnly}
            disabled={loading || initializing}
            className="w-full"
          >
            Use Redirect Instead
          </Button> */}

          <p className="text-center text-xs sm:text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <span className="underline">Terms of Service</span> and{' '}
            <span className="underline">Privacy Policy</span>.
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mx-auto block text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
