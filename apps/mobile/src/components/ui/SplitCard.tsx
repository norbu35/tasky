import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { interactiveStates } from '../../design/animations';
import { cn } from '../../lib/cn';

const { radius, spacing } = mobileTheme;
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
    scale.value = withSpring(interactiveStates.pressed.scale, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(interactiveStates.pressed.opacity, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const containerClassName = cn('rounded-lg overflow-hidden', className);

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
    <Wrapper {...(wrapperProps as any)}>
      <View
        style={{ minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
        className="bg-primary rounded-tl-lg rounded-tr-lg justify-center"
      >
        {headerContent}
      </View>
      <View style={{ padding: spacing.md }} className="bg-background rounded-bl-lg rounded-br-lg">
        {bodyContent}
      </View>
    </Wrapper>
  );
}
