import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { createMobileApiClient } from '../lib/mobileApiClient';
import { registerForPushNotificationsAsync } from '../lib/notifications';

import { useAuthStore } from './authStore';

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
  const { session } = useAuthStore();

  useEffect(() => {
    // Only attempt to register if the user is authenticated
    if (!session?.accessToken) return;

    registerForPushNotificationsAsync()
      .then(async (result) => {
        if (result.error) {
          console.warn('[Notifications] Setup error:', result.error);
          setError(result.error);
          return;
        }

        if (result.token) {
          setPushToken(result.token);

          // Register the token with the Tasky backend
          try {
            const apiClient = createMobileApiClient();
            await apiClient.registerDevice(session.accessToken, {
              token: result.token,
              platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            });
            console.log('[Notifications] Registered push token with backend successfully.');
          } catch (e) {
            console.error('[Notifications] Failed to sync token to backend', e);
          }
        }
      })
      .catch((e) => setError(String(e)));
  }, [session?.accessToken]);

  return (
    <NotificationContext.Provider value={{ pushToken, error }}>
      {children}
    </NotificationContext.Provider>
  );
}
