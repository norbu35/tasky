import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

interface InfoRowProps {
    label: string;
    value: string | React.ReactNode;
    icon?: React.ReactNode;
    testID?: string;
}

export function InfoRow({ label, value, icon, testID }: InfoRowProps) {
    const isStringValue = typeof value === 'string';

    return (
        <View style={styles.row} testID={testID} accessibilityLabel={isStringValue ? `${label}: ${value}` : label}>
            <View style={styles.left}>
                {icon && <View style={styles.icon}>{icon}</View>}
                <Text style={styles.label}>{label}</Text>
            </View>
            {isStringValue ? (
                <Text style={styles.value}>{value}</Text>
            ) : (
                <View>{value}</View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    icon: {
        marginRight: spacing.sm,
    },
    label: {
        fontSize: typography.label,
        color: colors.textSecondary,
    },
    value: {
        fontSize: typography.label,
        fontWeight: '600',
        color: colors.primary,
    },
});
