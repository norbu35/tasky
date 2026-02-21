import type { ApiClient, AuthTokens, Profile, User } from "../lib/apiClient";
import type { ClientEventName } from "../lib/clientAnalytics";

export type Role = "CUSTOMER" | "TASKER";

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
    refreshProfile: () => Promise<void>;
    updateSessionUser: (user: User) => void;
    signOut: () => void;
    trackClientEvent: (eventName: ClientEventName, refs?: { taskId?: string; bookingId?: string }) => void;
};
