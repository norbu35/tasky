import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, typography } = mobileTheme;

interface TrustBannerProps {
    title: string;
    description: string;
    variant?: 'default' | 'compact';
}

export function TrustBanner({ title, description, variant = 'default' }: TrustBannerProps) {
    const isCompact = variant === 'compact';
    return (
        <View style={[styles.container, isCompact && styles.containerCompact]}>
            <View style={[styles.iconContainer, isCompact ? styles.iconCircle : styles.iconSquare]}>
                <ShieldCheck size={isCompact ? 16 : 20} color={colors.trustMuted} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 17,
        borderRadius: radius.md,
        backgroundColor: 'rgba(255,221,184,0.3)',
        borderWidth: 1,
        borderColor: colors.trust,
    },
    containerCompact: {
        backgroundColor: colors.trust,
        borderWidth: 0,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSquare: {
        width: 37,
        height: 40,
        borderRadius: radius.sm,
        backgroundColor: colors.trust,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: 'rgba(101,62,0,0.1)',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: typography.caption,
        fontWeight: '700',
        color: colors.trustMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    description: {
        fontSize: typography.label,
        color: colors.trustForeground,
        lineHeight: 20,
    },
});
