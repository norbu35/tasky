import { cva } from 'class-variance-authority';
import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { interactiveStates, withInteractiveSpring } from '../../design/animations';
import { cn } from '../../lib/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// cva base — PressableCard has no visual variants; all elevation/animation stays imperative.
const cardVariants = cva('', {
  variants: {},
});

interface PressableCardProps {
  children: React.ReactNode;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  className?: string;
}

export function PressableCard({
  children,
  onPress,
  onPressIn,
  onPressOut,
  style,
  testID,
  className,
}: PressableCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withInteractiveSpring(interactiveStates.pressed.scale);
    opacity.value = withInteractiveSpring(interactiveStates.pressed.opacity);
    onPressIn?.();
  };

  const handlePressOut = () => {
    scale.value = withInteractiveSpring(1);
    opacity.value = withInteractiveSpring(1);
    onPressOut?.();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      testID={testID}
      className={cn(cardVariants(), className)}
      accessibilityRole="button"
    >
      {children}
    </AnimatedPressable>
  );
}
