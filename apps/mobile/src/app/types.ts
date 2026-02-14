import type {
  AuthTokens,
  MobileApiClient,
  Profile
} from "../lib/mobileApiClient";
import type { ClientAnalyticsTracker } from "../lib/clientAnalytics";

export type MobileRoute =
  | "auth"
  | "profile"
  | "customer"
  | "tasker"
  | "payment"
  | "safety"
  | "communication"
  | "restricted";

export type ToastVariant = "info" | "success" | "error";

export type AppProps = {
  apiClient?: MobileApiClient;
  initialRoute?: MobileRoute;
  initialSession?: AuthTokens | null;
  initialProfile?: Profile | null;
  locale?: string;
  analyticsTracker?: ClientAnalyticsTracker;
};
