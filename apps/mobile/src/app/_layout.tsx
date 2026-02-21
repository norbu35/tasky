import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NotificationProvider } from '../store/NotificationContext';
import { CopilotProvider } from 'react-native-copilot';

import '../utils/i18n';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NotificationProvider>
                    <QueryClientProvider client={queryClient}>
                        <CopilotProvider tooltipStyle={{ backgroundColor: '#ffffff', borderRadius: 8 }}>
                            <Stack screenOptions={{ headerShown: false }} />
                            <StatusBar style="auto" />
                        </CopilotProvider>
                    </QueryClientProvider>
                </NotificationProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
