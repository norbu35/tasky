import { create } from 'zustand';

import type { AuthTokens } from '../lib/api/types';

interface AuthState {
  session: AuthTokens | null;
  setSession: (session: AuthTokens | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  signOut: () => set({ session: null }),
}));
