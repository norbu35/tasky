import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { registerDevice, unregisterDevice } from '../features/notifications/api';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { useAuthStore } from '../store/authStore';

interface NotificationContextValue {
  pushToken: string | null;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextValue>({
  pushToken: null,
  error: null,
});

export function useNotificationContext() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);

  // Refs survive across renders so the cleanup path can read the latest
  // push token even after the state setter has queued an update.
  const pushTokenRef = useRef<string | null>(null);
  const prevSessionRef = useRef(session);

  useEffect(() => {
    const prev = prevSessionRef.current;
    prevSessionRef.current = session;

    // ── Session cleared — unregister push token from previous user ────
    // The previous access token is still server-valid (only the local
    // store was cleared), so the unregister call will succeed.
    if (prev?.accessToken && !session?.accessToken && pushTokenRef.current) {
      void unregisterDevice(prev.accessToken, pushTokenRef.current).catch(() => {});
    }

    // Only attempt to register if the user is authenticated
    if (!session?.accessToken) return;

    registerForPushNotificationsAsync()
      .then(async (result) => {
        if (result.error) {
          if (__DEV__) {
            console.warn('[Notifications] Setup error:', result.error);
          }
          setError(result.error);
          return;
        }

        if (result.token) {
          setPushToken(result.token);
          pushTokenRef.current = result.token;

          // Register the token with the Tasky backend
          try {
            await registerDevice(session.accessToken, {
              token: result.token,
              platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            });
          } catch (e) {
            if (__DEV__) {
              console.error('[Notifications] Failed to sync token to backend', e);
            }
          }
        }
      })
      .catch((e) => setError(String(e)));
  }, [session]);

  return (
    <NotificationContext.Provider value={{ pushToken, error }}>
      {children}
    </NotificationContext.Provider>
  );
}
