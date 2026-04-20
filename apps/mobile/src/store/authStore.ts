import { create } from 'zustand';

import type { AuthTokens, Profile } from '../lib/api/types';

interface AuthState {
  session: AuthTokens | null;
  profile: Profile | null;
  deviceToken: string | null;
  setSession: (session: AuthTokens | null) => void;
  setProfile: (profile: Profile | null) => void;
  setDeviceToken: (token: string | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  deviceToken: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setDeviceToken: (deviceToken) => set({ deviceToken }),
  signOut: () => set({ session: null, profile: null }),
}));
