import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { interactiveStates, withInteractiveSpring } from '@/design/animations';
import { elevations } from '@/design/elevations';
import { cn } from '@/lib/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SplitCardProps {
  headerContent: React.ReactNode;
  bodyContent: React.ReactNode;
  onPress?: () => void;
  testID?: string;
  className?: string;
}

export function SplitCard({
  headerContent,
  bodyContent,
  onPress,
  testID,
  className,
}: SplitCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withInteractiveSpring(interactiveStates.pressed.scale);
    opacity.value = withInteractiveSpring(interactiveStates.pressed.opacity);
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withInteractiveSpring(1);
    opacity.value = withInteractiveSpring(1);
  };

  const containerClassName = cn('rounded-md overflow-hidden', className);

  const Wrapper = onPress ? AnimatedPressable : View;
  const wrapperProps = onPress
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        style: [elevations.card, animatedStyle],
        className: containerClassName,
        testID,
        accessibilityRole: 'button' as const,
      }
    : { style: elevations.card, className: containerClassName, testID };

  return (
    <Wrapper {...(wrapperProps as Record<string, unknown>)}>
      <View className="min-h-touch-xl px-md py-sm bg-primary rounded-tl-lg rounded-tr-lg justify-center">
        {headerContent}
      </View>
      <View className="p-md bg-background rounded-bl-lg rounded-br-lg">{bodyContent}</View>
    </Wrapper>
  );
}
