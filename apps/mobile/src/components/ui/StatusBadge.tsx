import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, typography } = mobileTheme;

type StatusType = 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show';

const statusStyles: Record<StatusType, { bg: string; fg: string; label: string }> = {
    open: { bg: colors.statusOpen, fg: colors.statusOpenForeground, label: 'OPEN' },
    assigned: { bg: colors.statusAssigned, fg: colors.statusAssignedForeground, label: 'ASSIGNED' },
    completed: { bg: colors.verified, fg: colors.verifiedForeground, label: 'COMPLETED' },
    cancelled: { bg: colors.muted, fg: colors.mutedForeground, label: 'CANCELLED' },
    no_show: { bg: colors.danger, fg: colors.dangerForeground, label: 'NO SHOW' },
};

interface StatusBadgeProps {
    status: StatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const style = statusStyles[status];
    return (
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
            <Text style={[styles.text, { color: style.fg }]}>{style.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: radius.full,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: typography.micro,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
