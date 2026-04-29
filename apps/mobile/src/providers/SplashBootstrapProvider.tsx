import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { listBookings } from '@/features/bookings/api';
import { getMyProfile } from '@/features/profile/api';
import { getMyPendingReviews } from '@/features/review/api';
import { listCategories, listMyTasks, listTasks } from '@/features/tasks/api';
import { getVerificationStatus } from '@/features/verification/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';

// ── Public types ──────────────────────────────────────────────────────────────

export type BootstrapPhase =
  | 'initializing'
  | 'restoring-session'
  | 'prefetching'
  | 'minimum-display'
  | 'ready'
  | 'error';

export type BootstrapDestination = 'auth' | 'onboarding' | 'tabs' | null;

export interface SplashBootstrapState {
  phase: BootstrapPhase;
  destination: BootstrapDestination;
  error: string | null;
}

// ── Context ───────────────────────────────────────────────────────────────────

const SplashBootstrapContext = createContext<SplashBootstrapState>({
  phase: 'initializing',
  destination: null,
  error: null,
});

export function useSplashBootstrap(): SplashBootstrapState {
  return useContext(SplashBootstrapContext);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MINIMUM_SPLASH_MS = 1500;
const ONBOARDING_SPLASH_MS = 2000;

// ── Provider ──────────────────────────────────────────────────────────────────

export function SplashBootstrapProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const [state, setState] = useState<SplashBootstrapState>({
    phase: 'initializing',
    destination: null,
    error: null,
  });

  const mountedRef = useRef(true);
  const startedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function run() {
      // ── No session → go to auth immediately ────────────────────
      if (!session) {
        if (mountedRef.current) setState({ phase: 'ready', destination: 'auth', error: null });
        return;
      }

      const token = session.accessToken;
      const uid = session.user.id;
      const serverRole = session.user.role;

      // ── Initial launch (onboarding) ────────────────────────────
      // Hold splash for 2s while fetching data in the background.
      if (!hasSeenOnboarding) {
        if (mountedRef.current) {
          setState({ phase: 'minimum-display', destination: 'onboarding', error: null });
        }

        // Fire-and-forget background prefetches
        void prefetchCommon(queryClient, uid, token).catch(() => {});
        void prefetchForRole(queryClient, uid, token, serverRole).catch(() => {});

        await delay(ONBOARDING_SPLASH_MS);
        if (cancelled || !mountedRef.current) return;

        setState({ phase: 'ready', destination: 'onboarding', error: null });
        return;
      }

      // ── Returning user — prefetch, then navigate ──────────────
      if (mountedRef.current) {
        setState({ phase: 'prefetching', destination: 'tabs', error: null });
      }

      const prefetchStart = Date.now();

      try {
        await Promise.all([
          prefetchCommon(queryClient, uid, token),
          prefetchForRole(queryClient, uid, token, serverRole),
        ]);
      } catch {
        // Non-blocking — screens handle stale/fetching states gracefully
      }

      if (cancelled || !mountedRef.current) return;

      // Ensure minimum splash display time
      const elapsed = Date.now() - prefetchStart;
      const remaining = MINIMUM_SPLASH_MS - elapsed;
      if (remaining > 0) {
        if (mountedRef.current) {
          setState({ phase: 'minimum-display', destination: 'tabs', error: null });
        }
        await delay(remaining);
      }

      if (cancelled || !mountedRef.current) return;

      // Re-check session — transport may have called signOut() during prefetch
      // if a 401 triggered refresh failure. Navigate to auth instead of tabs.
      if (!useAuthStore.getState().session) {
        setState({ phase: 'ready', destination: 'auth', error: null });
        return;
      }

      setState({ phase: 'ready', destination: 'tabs', error: null });
    }

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SplashBootstrapContext.Provider value={state}>{children}</SplashBootstrapContext.Provider>
  );
}

// ── Prefetch helpers ──────────────────────────────────────────────────────────

/**
 * Data needed by both roles:
 * - Profile (user identity, status, avatar)
 * - Pending reviews (review gate)
 * - Categories (feed filters, intake)
 */
async function prefetchCommon(
  queryClient: ReturnType<typeof useQueryClient>,
  uid: string,
  token: string,
): Promise<void> {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.me.all(uid),
      queryFn: () => getMyProfile(token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.reviews.pending(uid),
      queryFn: () => safePendingReviews(token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.categories(uid),
      queryFn: () => listCategories(token),
    }),
  ]);
}

/**
 * Role-specific data for a fully hydrated first screen.
 *
 * Uses the server-authoritative role (from JWT) to guard permission-sensitive
 * endpoints. The local UI role (`currentRole`) determines which *screen* to
 * show, but the server role determines which API calls the token is authorised for.
 *
 * Customer: my tasks + customer bookings
 * Tasker:   open task feed + tasker bookings + verification status
 */
async function prefetchForRole(
  queryClient: ReturnType<typeof useQueryClient>,
  uid: string,
  token: string,
  serverRole: string,
): Promise<void> {
  if (serverRole === 'CUSTOMER') {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.tasks.my(uid),
        queryFn: () => listMyTasks(token),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.bookings.all(uid),
        queryFn: () => listBookings(token, {}),
      }),
    ]);
  } else if (serverRole === 'TASKER') {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.tasks.feed(uid, {}),
        queryFn: () => listTasks(token, { limit: 20 }),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.bookings.all(uid),
        queryFn: () => listBookings(token, {}),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.verification.status(uid),
        queryFn: () => getVerificationStatus(token),
      }),
    ]);
  }
  // ADMIN or unknown roles — no role-specific prefetch; screens load on demand
}

/**
 * Wraps getMyPendingReviews to guarantee an array return.
 * Prevents TypeError if the API returns an unexpected envelope shape
 * (e.g. `{ data: null }` or `{ }` instead of `{ data: [] }`).
 */
async function safePendingReviews(token: string) {
  try {
    const result = await getMyPendingReviews(token);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
