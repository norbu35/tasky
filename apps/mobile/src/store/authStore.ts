import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AuthTokens } from '../lib/api/types';

interface AuthState {
  session: AuthTokens | null;
  setSession: (session: AuthTokens | null) => void;
  signOut: () => void;
}

const secureStorage = {
  getItem: (name: string) => SecureStore.getItem(name),
  setItem: (name: string, value: string) => SecureStore.setItem(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

/**
 * Strips PII fields (phone, facebook_id) from the user object before
 * persisting to SecureStore.  These fields are re-fetched from /users/me
 * on every app launch via the bootstrap prefetch, so they are never needed
 * from disk.  Keeping them out of persisted storage reduces the PII surface
 * on disk.
 */
function sanitizeForStorage(state: AuthState): { session: AuthTokens | null } {
  if (!state.session) return { session: null };

  const { phone, facebook_id, ...safeUser } = state.session.user;

  return {
    session: {
      accessToken: state.session.accessToken,
      refreshToken: state.session.refreshToken,
      user: safeUser,
    },
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      signOut: () => set({ session: null }),
    }),
    {
      name: 'tasky-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: sanitizeForStorage,
    },
  ),
);
