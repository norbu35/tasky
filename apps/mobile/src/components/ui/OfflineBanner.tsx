import { WifiOff } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { animationPresets } from '@/design/animations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors } = mobileTheme;

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
      testID={testID}
      accessibilityLabel={t('offline.banner')}
      accessibilityRole="alert"
    >
      <View
        className={cn(
          'flex-row items-center justify-center bg-secondary py-sm px-lg gap-sm',
          className,
        )}
      >
        <WifiOff size={16} color={colors.primaryDeep} />
        <Text className="text-label font-sans-semibold text-primary-deep">
          {t('offline.banner')}
        </Text>
      </View>
    </Animated.View>
  );
}
