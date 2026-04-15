import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { animationPresets } from '../../design/animations';
import { mobileTheme } from '../../design/tokenAdapter';

const { radius } = mobileTheme;

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  testID?: string;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = radius.sm,
  style,
  testID,
}: SkeletonLoaderProps) {
  const { t } = useTranslation();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: animationPresets.skeleton.duration,
        easing: animationPresets.skeleton.easing,
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className="bg-muted"
      style={[{ width: width as any, height, borderRadius }, animatedStyle, style]}
      testID={testID}
      accessibilityLabel={t('common.loading')}
    />
  );
}
