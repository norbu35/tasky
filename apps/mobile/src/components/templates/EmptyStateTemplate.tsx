import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../ui/Button';

const { colors, spacing, typography, radius } = mobileTheme;

export interface EmptyStateTemplateProps {
    title: string;
    description?: string;
    ctaLabel?: string;
    ctaOnPress?: () => void;
    icon?: React.ReactNode;
    testID?: string;
}

export function EmptyStateTemplate({
    title,
    description,
    ctaLabel,
    ctaOnPress,
    icon,
    testID,
}: EmptyStateTemplateProps) {
    return (
        <View style={styles.container} testID={testID}>
            {icon && (
                <View style={styles.iconContainer}>
                    {icon}
                </View>
            )}
            <Text style={styles.title}>{title}</Text>
            {description && (
                <Text style={styles.description}>{description}</Text>
            )}
            {ctaLabel && ctaOnPress && (
                <Button
                    label={ctaLabel}
                    onPress={ctaOnPress}
                    style={styles.cta}
                    testID={testID ? `${testID}-cta` : undefined}
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
    cta: {
        marginTop: spacing.xl,
        alignSelf: 'stretch',
    },
});
