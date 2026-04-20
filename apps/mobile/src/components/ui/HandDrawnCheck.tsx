import { CheckCircle } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '@/design/animations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

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
      scale.value = withSpring(1, springs.emphasis);
    }
  }, [animated, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      testID={testID}
      accessibilityLabel={t('common.success')}
      accessibilityRole="image"
    >
      <View className={cn(className)}>
        <CheckCircle size={size} color={color} strokeWidth={3} />
      </View>
    </Animated.View>
  );
}
