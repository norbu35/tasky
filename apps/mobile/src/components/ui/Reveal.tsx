import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { animationPresets } from '../../design/animations';

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function Reveal({
  children,
  delay = 0,
  distance = 16,
  style,
  className,
  testID,
}: RevealProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(animationPresets.enter.duration).delay(delay).springify()}
      style={style}
      className={className}
      testID={testID}
    >
      <Animated.View
        entering={FadeInDown.duration(animationPresets.enter.duration)
          .delay(delay)
          .withInitialValues({
            opacity: 0,
            transform: [{ translateY: distance }],
          })}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}
