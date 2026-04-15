import { QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReviewGateProvider } from '../features/review/components/ReviewGateProvider';
import { getSharedApiClient } from '../lib/mobileApiClient';
import { queryClient } from '../lib/react-query';
import { RoleProvider } from '../providers/RoleProvider';
import { NotificationProvider } from '../store/NotificationContext';
import { useAuthStore } from '../store/authStore';

import '../utils/i18n';
import '../design/nativewind-interop';

import '../../global.css';

// Wire token refresh delegate so 401s trigger silent refresh
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

// Suppress all LogBox warnings to prevent the yellow dev bar from
// overlaying UI elements during Maestro E2E tests.
LogBox.ignoreAllLogs();

// Firebase native modules only work in EAS/bare builds, not Expo Go.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messaging = require('@react-native-firebase/messaging').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const notifee = require('@notifee/react-native').default;

    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      if (!remoteMessage.notification) {
        await notifee.displayNotification({
          title: remoteMessage.data?.title,
          body: remoteMessage.data?.body,
          android: { channelId: 'default' },
          ios: {},
        });
      }
    });
  } catch {
    // Firebase not available — running in Expo Go
  }
}

export default function RootLayout() {
  useEffect(() => {
    if (isExpoGo) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const messaging = require('@react-native-firebase/messaging').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const notifee = require('@notifee/react-native').default;

      const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
        await notifee.displayNotification({
          title: remoteMessage.notification?.title ?? remoteMessage.data?.title,
          body: remoteMessage.notification?.body ?? remoteMessage.data?.body,
          android: { channelId: 'default' },
          ios: {},
        });
      });
      return unsubscribe;
    } catch {
      // Firebase not available
    }
  }, []);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <RoleProvider>
              <ReviewGateProvider>
                <Stack screenOptions={{ headerShown: false }} />
                <StatusBar style="auto" />
              </ReviewGateProvider>
            </RoleProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
