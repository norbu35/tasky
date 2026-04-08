import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { animationPresets } from '../../design/animations';
import { cn } from '../../lib/cn';

const { colors, typography } = mobileTheme;

interface OfflineBannerProps {
  visible: boolean;
  testID?: string;
  className?: string;
}

export function OfflineBanner({ visible, testID, className }: OfflineBannerProps) {
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
      style={animatedStyle}
      className={cn(
        'flex-row items-center justify-center bg-secondary py-sm px-lg gap-sm',
        className,
      )}
      testID={testID}
      accessibilityLabel={t('offline.banner')}
      accessibilityRole="alert"
    >
      <WifiOff size={16} color={colors.primaryDeep} />
      <Text style={{ fontSize: typography.label, fontWeight: '600', color: colors.primaryDeep }}>
        {t('offline.banner')}
      </Text>
    </Animated.View>
  );
}
