import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NotificationProvider } from '../store/NotificationContext';
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

import '../utils/i18n';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Background / quit-state FCM handler.
// MUST be registered at module scope (outside any component) and before any
// other code runs. FCM delivers data-only payloads here when the app is not
// in the foreground.
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // For notification messages (title + body present), FCM shows a system
    // tray notification automatically on Android. For data-only payloads,
    // display a local notification via Notifee.
    if (!remoteMessage.notification) {
        await notifee.displayNotification({
            title: remoteMessage.data?.title as string | undefined,
            body: remoteMessage.data?.body as string | undefined,
            android: { channelId: 'default' },
        });
    }
});

export default function RootLayout() {
    useEffect(() => {
        // Foreground FCM handler: when the app is open, FCM does NOT auto-display
        // a system notification. We must display it manually via Notifee.
        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
            await notifee.displayNotification({
                title: remoteMessage.notification?.title ?? remoteMessage.data?.title as string | undefined,
                body: remoteMessage.notification?.body ?? remoteMessage.data?.body as string | undefined,
                android: { channelId: 'default' },
                ios: {},
            });
        });
        return unsubscribe;
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NotificationProvider>
                    <QueryClientProvider client={queryClient}>
                        <Stack screenOptions={{ headerShown: false }} />
                        <StatusBar style="auto" />
                    </QueryClientProvider>
                </NotificationProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
