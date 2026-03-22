import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { animationPresets } from '../../design/animations';

const { colors, spacing, typography } = mobileTheme;

interface OfflineBannerProps {
    visible: boolean;
    testID?: string;
}

export function OfflineBanner({ visible, testID }: OfflineBannerProps) {
    const { t } = useTranslation();
    const translateY = useSharedValue(-60);

    useEffect(() => {
        translateY.value = withTiming(visible ? 0 : -60, {
            duration: animationPresets.enter.duration,
            easing: animationPresets.enter.easing,
        });
    }, [visible, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View
            style={[styles.banner, animatedStyle]}
            testID={testID}
            accessibilityLabel={t('offline.banner')}
            accessibilityRole="alert"
        >
            <WifiOff size={16} color={colors.primaryDeep} />
            <Text style={styles.text}>{t('offline.banner')}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.secondary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    text: {
        fontSize: typography.label,
        fontWeight: '600',
        color: colors.primaryDeep,
    },
});
