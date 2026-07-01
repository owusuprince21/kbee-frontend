'use client';

import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAuthed = Boolean(user);

  /**
   * Runs `fn` only if authed; otherwise nudges user to sign in and redirects.
   * The user will be returned to `nextUrl` (defaults to current page) after sign-in.
   */
  const ensureAuth = (fn: () => void, nextUrl?: string) => {
    if (!isAuthed) {
      toast.message('Please sign in to continue');
      const next = nextUrl ?? pathname ?? '/';
      router.push(`/signin?next=${encodeURIComponent(next)}`);
      return;
    }
    fn();
  };

  return { isAuthed, ensureAuth };
}
