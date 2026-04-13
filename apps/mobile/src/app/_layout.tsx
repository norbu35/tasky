import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NotificationProvider } from '../store/NotificationContext';
import { useEffect } from 'react';
import Constants from 'expo-constants';
import { RoleProvider } from '../providers/RoleProvider';
import { ReviewGateProvider } from '../features/review/components/ReviewGateProvider';

import '../utils/i18n';
import '../design/nativewind-interop';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../../global.css';

import { LogBox } from 'react-native';

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
