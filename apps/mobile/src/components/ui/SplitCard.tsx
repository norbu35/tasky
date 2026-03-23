import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { interactiveStates } from '../../design/animations';

const { colors, radius, spacing } = mobileTheme;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SplitCardProps {
  headerContent: React.ReactNode;
  bodyContent: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}

export function SplitCard({ headerContent, bodyContent, onPress, testID }: SplitCardProps) {
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

  const Wrapper = onPress ? AnimatedPressable : View;
  const wrapperProps = onPress
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        style: [styles.container, animatedStyle],
        testID,
        accessibilityRole: 'button' as const,
      }
    : { style: styles.container, testID };

  return (
    <Wrapper {...(wrapperProps as any)}>
      <View style={styles.header}>{headerContent}</View>
      <View style={styles.body}>{bodyContent}</View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...elevations.card,
  },
  header: {
    height: 56,
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  body: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    padding: spacing.md,
  },
});
