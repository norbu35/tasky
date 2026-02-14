import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ApiClient,
  AuthTokens,
  Profile,
  User
} from "../lib/apiClient";
import type {
  ActorRole,
  ClientAnalyticsTracker,
  ClientEventName
} from "../lib/clientAnalytics";
import { AppContext } from "./context/AppContext";
import { AppRoutes } from "./router/AppRoutes";
import type { AppContextValue } from "./types";
import { parseError } from "./utils/errorHandling";

export function AppShell({
  apiClient,
  initialSession,
  locale,
  analyticsTracker
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
      setProfileError(parseError(error));
    } finally {
      setProfileBusy(false);
    }
  }, [apiClient, session]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const signOut = useCallback(() => {
    setSession(null);
    setProfile(null);
    setProfileError(null);
    setProfileBusy(false);
  }, []);

  const updateSessionUser = useCallback((user: User) => {
    setSession((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        user
      };
    });
  }, []);

  const trackClientEvent = useCallback(
    (eventName: ClientEventName, refs?: { taskId?: string; bookingId?: string }) => {
      const actorRole = (profile?.role ?? session?.user?.role ?? "UNKNOWN") as ActorRole;
      analyticsTracker({
        event_name: eventName,
        platform: "WEB",
        locale,
        actor_role: actorRole,
        task_id: refs?.taskId,
        booking_id: refs?.bookingId,
        timestamp: new Date().toISOString()
      });
    },
    [analyticsTracker, locale, profile?.role, session?.user?.role]
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
      trackClientEvent
    }),
    [
      apiClient,
      locale,
      profile,
      profileBusy,
      profileError,
      refreshProfile,
      session,
      setSession,
      signOut,
      trackClientEvent,
      updateSessionUser
    ]
  );

  return (
    <AppContext.Provider value={value}>
      <AppRoutes />
    </AppContext.Provider>
  );
}
