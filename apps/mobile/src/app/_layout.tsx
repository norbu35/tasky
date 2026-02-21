import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import '../utils/i18n';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <Stack screenOptions={{headerShown: false}}/>
                <StatusBar style="auto"/>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
