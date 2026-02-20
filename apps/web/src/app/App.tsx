import { useState } from "react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ApiClient, type AuthTokens, createApiClient } from "../lib/apiClient";
import {
    type ClientAnalyticsTracker,
    createConsoleClientAnalyticsTracker,
    resolveClientLocale
} from "../lib/clientAnalytics";
import { AppShell } from "./AppShell";


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
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: false // Disable retries for tests and faster failing in UI
            }
        }
    }));
    const resolvedApiClient = apiClient ?? createApiClient();
    const resolvedLocale = resolveClientLocale(locale);
    const resolvedAnalyticsTracker = analyticsTracker ?? createConsoleClientAnalyticsTracker();

    if (initialRoute) {
        return (
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[initialRoute]}>
                    <AppShell
                        apiClient={resolvedApiClient}
                        initialSession={initialSession}
                        locale={resolvedLocale}
                        analyticsTracker={resolvedAnalyticsTracker}
                    />
                </MemoryRouter>
            </QueryClientProvider>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AppShell
                    apiClient={resolvedApiClient}
                    initialSession={initialSession}
                    locale={resolvedLocale}
                    analyticsTracker={resolvedAnalyticsTracker}
                />
            </BrowserRouter>
        </QueryClientProvider>
    );
}
