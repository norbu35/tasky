import * as Sentry from '@sentry/react-native';

import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReviewGateProvider } from '../features/review/components/ReviewGateProvider';
import { isNativeFirebaseAvailable } from '../lib/nativeFirebase';
import { queryClient } from '../lib/react-query';
import { AppBootstrapProvider } from '../providers/AppBootstrapProvider';
import { NotificationProvider } from '../providers/NotificationProvider';
import { RoleProvider } from '../providers/RoleProvider';
import { SplashBootstrapProvider } from '../providers/SplashBootstrapProvider';
import { initializeI18n } from '../utils/i18n';

import '../design/nativewind-interop';

import '../../global.css';

// Initialise Sentry before any code that could throw.
// DSN is read from EXPO_PUBLIC_SENTRY_DSN in the environment.
Sentry.init({
  dsn: process.env['EXPO_PUBLIC_SENTRY_DSN'],
  tracesSampleRate: 0.0, // Phase 1: errors only
});

// Dev-only: expose testSentry() on global for manual crash-report verification.
if (__DEV__) {
  (global as any).testSentry = () => Sentry.captureException(new Error('Sentry test error'));
}

// Firebase background handler must be registered at module scope for headless JS execution.
if (isNativeFirebaseAvailable()) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messaging = require('@react-native-firebase/messaging').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const notifee = require('@notifee/react-native').default;

    messaging().setBackgroundMessageHandler(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        if (!remoteMessage.notification) {
          await notifee.displayNotification({
            title: remoteMessage.data?.['title'],
            body: remoteMessage.data?.['body'],
            android: { channelId: 'default' },
            ios: {},
          });
        }
      },
    );
  } catch {
    // Firebase not available — running in Expo Go
  }
}

export default Sentry.wrap(function RootLayout() {
  useEffect(() => {
    void initializeI18n();
  }, []);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <AppBootstrapProvider>
              <SplashBootstrapProvider>
                <RoleProvider>
                  <ReviewGateProvider>
                    <Stack screenOptions={{ headerShown: false }} />
                    <StatusBar style="auto" />
                  </ReviewGateProvider>
                </RoleProvider>
              </SplashBootstrapProvider>
            </AppBootstrapProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
