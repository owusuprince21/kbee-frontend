import { create } from 'zustand';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
  authReady: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setAuthReady: (authReady: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    token: null,
    hasHydrated: true,
    authReady: false,
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),
    setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    setAuthReady: (authReady) => set({ authReady }),
    logout: () => set({ user: null, token: null }),
  })
);
