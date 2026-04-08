import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { interactiveStates } from '../../design/animations';

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
    scale.value = withSpring(interactiveStates.pressed.scale, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(interactiveStates.pressed.opacity, { damping: 15, stiffness: 300 });
    onPressIn?.();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 300 });
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
