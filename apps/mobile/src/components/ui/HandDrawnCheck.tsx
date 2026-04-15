import { CheckCircle } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { animationPresets } from '../../design/animations';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors } = mobileTheme;

interface HandDrawnCheckProps {
  size?: number;
  color?: string;
  animated?: boolean;
  testID?: string;
  className?: string;
}

export function HandDrawnCheck({
  size = 48,
  color = colors.verified,
  animated = true,
  testID,
  className,
}: HandDrawnCheckProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      scale.value = withTiming(1, {
        duration: animationPresets.celebration.duration,
        easing: animationPresets.celebration.easing,
      });
    }
  }, [animated, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(className)}
      testID={testID}
      accessibilityLabel={t('common.success')}
      accessibilityRole="image"
    >
      <CheckCircle size={size} color={color} />
    </Animated.View>
  );
}
