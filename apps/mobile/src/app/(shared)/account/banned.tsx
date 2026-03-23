import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function BannedAccountScreen() {
    const { t } = useTranslation();

    return (
        <View style={styles.container} testID="banned-screen">
            <Text style={styles.title}>{t('shared.account.bannedTitle')}</Text>
            <Text style={styles.body}>{t('shared.account.bannedBody')}</Text>
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
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    body: {
        fontSize: typography.body,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: typography.body * 1.5,
    },
});
