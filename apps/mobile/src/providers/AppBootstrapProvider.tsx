import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { getSharedApiClient } from '../lib/mobileApiClient';
import { isNativeFirebaseAvailable } from '../lib/nativeFirebase';
import { useAuthStore } from '../store/authStore';

export function AppBootstrapProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const prevSessionRef = useRef(session);

  // ── Clear React Query cache on sign-out ──────────────────────────
  // Watches for session transitioning from authenticated to null across
  // ALL sign-out paths (manual, token-refresh failure, account deletion)
  // and clears the entire query cache so stale data from a previous user
  // never leaks to the next session.
  useEffect(() => {
    if (prevSessionRef.current && !session) {
      queryClient.clear();
    }
    prevSessionRef.current = session;
  }, [session, queryClient]);

  // Wire token refresh delegate so 401s trigger silent refresh
  useEffect(() => {
    const apiClient = getSharedApiClient();
    apiClient.setTokenRefreshDelegate({
      getRefreshToken() {
        return useAuthStore.getState().session?.refreshToken ?? null;
      },
      onTokensRefreshed(accessToken, refreshToken) {
        const current = useAuthStore.getState().session;
        if (current) {
          useAuthStore.getState().setSession({
            ...current,
            accessToken,
            refreshToken,
          });
        }
      },
      onRefreshFailed() {
        useAuthStore.getState().signOut();
      },
    });
  }, []);

  // Bridge AppState changes to React Query focusManager
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    });

    return () => subscription.remove();
  }, []);

  // Foreground FCM message handler
  useEffect(() => {
    if (!isNativeFirebaseAvailable()) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const messaging = require('@react-native-firebase/messaging').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const notifee = require('@notifee/react-native').default;

      const unsubscribe = messaging().onMessage(
        async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
          await notifee.displayNotification({
            title: remoteMessage.notification?.title ?? remoteMessage.data?.['title'],
            body: remoteMessage.notification?.body ?? remoteMessage.data?.['body'],
            android: { channelId: 'default' },
            ios: {},
          });
        },
      );
      return unsubscribe;
    } catch {
      // Firebase not available
    }
  }, []);

  return <>{children}</>;
}
