import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function PendingScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <View style={styles.container} testID="pending-screen">
            <View style={styles.iconContainer}>
                <Clock size={40} color={colors.accent} />
            </View>
            <Text style={styles.title}>
                {t('tasker.verification.pendingTitle')}
            </Text>
            <Text style={styles.description}>
                {t('tasker.verification.pendingBody')}
            </Text>
            <Text style={styles.sla}>
                {t('tasker.verification.pendingSla')}
            </Text>
            <Button
                label={t('tasker.verification.submittedCta')}
                onPress={() => router.replace('/(tabs)')}
                style={styles.cta}
                testID="pending-screen-cta"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: colors.muted,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: typography.title,
        fontWeight: '700',
        color: colors.primary,
        textAlign: 'center',
    },
    description: {
        fontSize: typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        lineHeight: typography.body * 1.6,
    },
    sla: {
        fontSize: typography.body,
        color: colors.accent,
        textAlign: 'center',
        marginTop: spacing.md,
        fontWeight: '500',
    },
    cta: {
        marginTop: spacing.xl,
        alignSelf: 'stretch',
    },
});
