import {BrowserRouter, MemoryRouter} from "react-router-dom";
import {type ApiClient, type AuthTokens, createApiClient} from "../lib/apiClient";
import {
    type ClientAnalyticsTracker,
    createConsoleClientAnalyticsTracker,
    resolveClientLocale
} from "../lib/clientAnalytics";
import {AppShell} from "./AppShell";

export interface AppProps {
  apiClient?: ApiClient;
  initialRoute?: string;
  initialSession?: AuthTokens | null;
  locale?: string;
  analyticsTracker?: ClientAnalyticsTracker;
}

export function App({
  apiClient,
  initialRoute,
  initialSession = null,
  locale,
  analyticsTracker
}: AppProps) {
  const resolvedApiClient = apiClient ?? createApiClient();
  const resolvedLocale = resolveClientLocale(locale);
  const resolvedAnalyticsTracker = analyticsTracker ?? createConsoleClientAnalyticsTracker();

  if (initialRoute) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppShell
          apiClient={resolvedApiClient}
          initialSession={initialSession}
          locale={resolvedLocale}
          analyticsTracker={resolvedAnalyticsTracker}
        />
      </MemoryRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppShell
        apiClient={resolvedApiClient}
        initialSession={initialSession}
        locale={resolvedLocale}
        analyticsTracker={resolvedAnalyticsTracker}
      />
    </BrowserRouter>
  );
}
