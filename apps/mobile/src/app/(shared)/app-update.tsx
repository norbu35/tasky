import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { openURL } from 'expo-linking';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../../components/ui/Button';

const { colors, spacing, typography } = mobileTheme;

const APP_STORE_URL = Platform.select({
    ios: 'https://apps.apple.com/app/tasky',
    android: 'https://play.google.com/store/apps/details?id=com.tasky',
    default: 'https://tasky.mn',
});

export default function AppUpdateScreen() {
    const { t } = useTranslation();
    const params = useLocalSearchParams<{ type?: string }>();
    const isForce = params.type === 'force';

    const title = isForce
        ? t('infra.appUpdate.forceTitle', 'Update Required')
        : t('infra.appUpdate.softTitle', 'Update Available');

    const body = isForce
        ? t('infra.appUpdate.forceBody', 'Please update to continue using Tasky')
        : t('infra.appUpdate.softBody', 'A new version is available');

    const updateLabel = isForce
        ? t('infra.appUpdate.forceUpdate', 'Update Now')
        : t('infra.appUpdate.softUpdate', 'Update');

    const handleUpdate = useCallback(() => {
        openURL(APP_STORE_URL);
    }, []);

    const handleDismiss = useCallback(() => {
        // Navigate back or dismiss
    }, []);

    return (
        <View style={styles.container} testID="app-update-screen">
            <Download size={48} color={colors.primary} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
            <Button
                label={updateLabel}
                onPress={handleUpdate}
                style={styles.updateButton}
                testID="app-update-screen-update"
            />
            {!isForce && (
                <Button
                    label={t('infra.appUpdate.softDismiss', 'Not Now')}
                    variant="ghost"
                    onPress={handleDismiss}
                    style={styles.dismissButton}
                    testID="app-update-screen-dismiss"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: typography.title,
        fontWeight: '700',
        color: colors.primary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    body: {
        fontSize: typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        lineHeight: typography.body * 1.6,
    },
    updateButton: {
        marginTop: spacing.xl,
        alignSelf: 'stretch',
    },
    dismissButton: {
        marginTop: spacing.md,
        alignSelf: 'stretch',
    },
});
