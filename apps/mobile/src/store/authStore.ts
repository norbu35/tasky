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
    },
  ),
);
