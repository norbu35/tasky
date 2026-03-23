import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiClient, AuthTokens, Profile, User } from './lib/apiClient';
import type { ActorRole, ClientAnalyticsTracker, ClientEventName } from './lib/clientAnalytics';
import { AppContext } from './context/AppContext';
import { AppRoutes } from './router/AppRoutes';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { GlobalErrorFallback } from './components/feature/GlobalErrorFallback';
import type { AppContextValue } from './context/AppContext';
import { parseError } from './lib/errorHandling';
import { useTranslation } from 'react-i18next';

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

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!session) {
      setProfile(null);
      setProfileBusy(false);
      return;
    }

    setProfileBusy(true);
    setProfileError(null);

    try {
      const loaded = await apiClient.getMyProfile(session.accessToken);
      setProfile(loaded);
    } catch (error) {
      setProfileError(parseError(error, analyticsTracker));
    } finally {
      setProfileBusy(false);
    }
  }, [analyticsTracker, apiClient, session]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const { t } = useTranslation();

  const signOut = useCallback(() => {
    setSession(null);
    setProfile(null);
    setProfileError(null);
    setProfileBusy(false);
  }, []);

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
      updateSessionUser,
      signOut,
      trackClientEvent,
    }),
    [
      apiClient,
      locale,
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
      {/* Sitewise Metallic Gradient Streak Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[9999] bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.4)_35%,rgba(255,255,255,0.4)_40%,transparent_55%)] mix-blend-overlay opacity-10"></div>
      <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
        <AppRoutes />
      </ErrorBoundary>
      <Toaster position="bottom-right" />
    </AppContext.Provider>
  );
}
