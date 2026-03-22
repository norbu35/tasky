import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { mobileTheme } from '../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function SplashScreen() {
    const { t } = useTranslation();
    const session = useAuthStore((state) => state.session);
    const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);

    if (!hasSeenOnboarding) {
        return <Redirect href="/onboarding" />;
    }

    if (session) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <View style={styles.container} testID="splash-screen">
            <View style={styles.content}>
                <Text style={styles.logo}>Tasky</Text>
                <Text style={styles.tagline}>
                    {t('auth.splash.tagline', 'Trusted taskers, easy booking')}
                </Text>
            </View>
            <ActivityIndicator
                testID="splash-loading"
                size="large"
                color={colors.primary}
                style={styles.loader}
            />
            <Redirect href="/(auth)" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        fontSize: typography.heroTitle,
        fontWeight: '700',
        color: colors.primaryDeep,
        fontFamily: 'Manrope',
        marginBottom: spacing.md,
    },
    tagline: {
        fontSize: typography.body,
        color: colors.primary,
        textAlign: 'center',
    },
    loader: {
        marginTop: spacing['2xl'],
    },
});
