import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { Button } from './Button';

const { colors, radius, spacing, typography } = mobileTheme;

interface PermissionPrimerProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onGrant: () => void;
    onSkip: () => void;
    testID?: string;
}

export function PermissionPrimer({
    icon,
    title,
    description,
    onGrant,
    onSkip,
    testID,
}: PermissionPrimerProps) {
    const { t } = useTranslation();

    return (
        <View style={styles.card} testID={testID}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            <View style={styles.actions}>
                <Button
                    testID="permission-allow-button"
                    label={t('common.allow')}
                    variant="default"
                    onPress={onGrant}
                    style={styles.grantButton}
                    accessibilityLabel={t('common.allow')}
                />
                <Button
                    testID="permission-skip-button"
                    label={t('common.skip')}
                    variant="ghost"
                    onPress={onSkip}
                    accessibilityLabel={t('common.skip')}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        ...elevations.card,
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.title,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    description: {
        fontSize: typography.body,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    actions: {
        width: '100%',
        gap: spacing.sm,
    },
    grantButton: {
        width: '100%',
    },
});
