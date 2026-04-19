import { createContext, useContext } from 'react';

import type { ApiClient, AuthTokens, Profile, User } from '../lib/apiClient';
import type { ClientEventName } from '../lib/clientAnalytics';

export type Role = 'CUSTOMER' | 'TASKER';

export type AppContextValue = {
  apiClient: ApiClient;
  locale: string;
  session: AuthTokens | null;
  profile: Profile | null;
  profileBusy: boolean;
  profileError: string | null;
  setSession: (session: AuthTokens | null) => void;
  setProfile: (profile: Profile | null) => void;
  setProfileError: (message: string | null) => void;
  /** Fetch the profile using the current session (stale-closure safe via `session` dep). */
  refreshProfile: () => Promise<void>;
  /**
   * Fetch the profile using an explicitly provided access token.
   * Use this when you need to load the profile immediately after setting a new
   * session, before React has re-rendered and updated the `session` closure.
   */
  loadProfile: (accessToken: string) => Promise<void>;
  updateSessionUser: (user: User) => void;
  signOut: () => void;
  trackClientEvent: (
    eventName: ClientEventName,
    refs?: { taskId?: string; bookingId?: string },
  ) => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('App context is missing.');
  }
  return context;
}
