import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { GlobalErrorFallback } from './components/feature/GlobalErrorFallback';
import { Toaster } from './components/ui/sonner';
import { AppContext } from './context/AppContext';
import type { AppContextValue } from './context/AppContext';
import { HttpApiClient } from './lib/apiClient';
import type { ApiClient, AuthTokens, Profile, User } from './lib/apiClient';
import type { ActorRole, ClientAnalyticsTracker, ClientEventName } from './lib/clientAnalytics';
import { parseError } from './lib/errorHandling';
import { AppRoutes } from './router/AppRoutes';

export function AppShell({
  apiClient,
  initialSession,
  locale,
  analyticsTracker,
}: {
  apiClient: ApiClient;
  initialSession: AuthTokens | null;
  locale: string;
  analyticsTracker: ClientAnalyticsTracker;
}) {
  const [session, setSession] = useState<AuthTokens | null>(initialSession);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileBusy, setProfileBusy] = useState(Boolean(initialSession));
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (accessToken: string): Promise<void> => {
      setProfileBusy(true);
      setProfileError(null);

      try {
        const loaded = await apiClient.getMyProfile(accessToken);
        setProfile(loaded);
      } catch (error) {
        setProfileError(parseError(error, analyticsTracker));
      } finally {
        setProfileBusy(false);
      }
    },
    [analyticsTracker, apiClient],
  );

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!session) {
      setProfile(null);
      setProfileBusy(false);
      return;
    }
    await loadProfile(session.accessToken);
  }, [loadProfile, session]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const { t } = useTranslation();

  const signOut = useCallback(() => {
    if (session?.accessToken) {
      apiClient.logout(session.accessToken).catch(() => {
        // Best-effort: clear session regardless of API response
      });
    }
    setSession(null);
    setProfile(null);
    setProfileError(null);
    setProfileBusy(false);
  }, [session?.accessToken, apiClient]);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    if (apiClient instanceof HttpApiClient) {
      apiClient.setTokenRefreshDelegate({
        getRefreshToken() {
          return sessionRef.current?.refreshToken ?? null;
        },
        onTokensRefreshed(accessToken, refreshToken) {
          const current = sessionRef.current;
          if (current) {
            setSession({ ...current, accessToken, refreshToken });
          }
        },
        onRefreshFailed() {
          signOut();
        },
      });
    }
  }, [apiClient, setSession, signOut]);

  useEffect(() => {
    const handleUnauthorized = () => {
      signOut();
      toast.error(t('errors.sessionExpired', 'Session expired. Please log in again.'));
    };

    window.addEventListener('tasky:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('tasky:unauthorized', handleUnauthorized);
  }, [signOut, t]);

  const updateSessionUser = useCallback((user: User) => {
    setSession((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        user,
      };
    });
  }, []);

  const trackClientEvent = useCallback(
    (eventName: ClientEventName, refs?: { taskId?: string; bookingId?: string }) => {
      const actorRole = (profile?.role ?? session?.user?.role ?? 'UNKNOWN') as ActorRole;
      analyticsTracker({
        event_name: eventName,
        platform: 'WEB',
        locale,
        actor_role: actorRole,
        task_id: refs?.taskId,
        booking_id: refs?.bookingId,
        timestamp: new Date().toISOString(),
      });
    },
    [analyticsTracker, locale, profile?.role, session?.user?.role],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      apiClient,
      locale,
      session,
      profile,
      profileBusy,
      profileError,
      setSession,
      setProfile,
      setProfileError,
      refreshProfile,
      loadProfile,
      updateSessionUser,
      signOut,
      trackClientEvent,
    }),
    [
      apiClient,
      locale,
      loadProfile,
      profile,
      profileBusy,
      profileError,
      refreshProfile,
      session,
      signOut,
      trackClientEvent,
      updateSessionUser,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      <div className="bg-background min-h-screen">
        <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
          <AppRoutes />
        </ErrorBoundary>
        <Toaster position="bottom-right" />
      </div>
    </AppContext.Provider>
  );
}
