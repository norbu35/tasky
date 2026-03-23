import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { animationPresets } from '../../design/animations';

const { colors, radius } = mobileTheme;

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
      style={[styles.skeleton, { width: width as any, height, borderRadius }, animatedStyle, style]}
      testID={testID}
      accessibilityLabel="Loading"
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.muted,
  },
});
