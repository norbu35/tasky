import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { EntryOrExitLayoutType } from 'react-native-reanimated';

import { animationPresets } from '../../design/animations';

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

type LayoutAnimationBuilder = {
  delay?: (delayMs: number) => LayoutAnimationBuilder;
  springify?: () => LayoutAnimationBuilder;
  withInitialValues?: (values: {
    opacity: number;
    transform: Array<{ translateY: number }>;
  }) => LayoutAnimationBuilder;
};

function createRevealAnimation(duration: number, delay: number) {
  const fadeIn = FadeInDown as unknown as
    | {
        duration?: (value: number) => LayoutAnimationBuilder;
      }
    | undefined;

  if (!fadeIn || typeof fadeIn.duration !== 'function') {
    return undefined;
  }

  return fadeIn.duration(duration).delay?.(delay);
}

export function Reveal({
  children,
  delay = 0,
  distance = 16,
  style,
  className,
  testID,
}: RevealProps) {
  const revealAnimation = createRevealAnimation(animationPresets.enter.duration, delay);
  const rootEntering = revealAnimation?.springify?.() as EntryOrExitLayoutType | undefined;
  const childEntering = revealAnimation?.withInitialValues?.({
    opacity: 0,
    transform: [{ translateY: distance }],
  }) as EntryOrExitLayoutType | undefined;

  return (
    <Animated.View entering={rootEntering} style={style} testID={testID}>
      <View className={className}>
        <Animated.View entering={childEntering}>{children}</Animated.View>
      </View>
    </Animated.View>
  );
}
