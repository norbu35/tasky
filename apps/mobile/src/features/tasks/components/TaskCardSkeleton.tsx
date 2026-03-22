import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';

const { colors, spacing, radius } = mobileTheme;

export function TaskCardSkeleton() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={styles.titleSkeleton} />
      <View style={styles.priceSkeleton} />
      <View style={styles.locSkeleton} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    ...elevations.card,
  },
  titleSkeleton: {
    height: 20,
    backgroundColor: colors.muted,
    borderRadius: radius.xs,
    marginBottom: spacing.sm,
    width: '80%',
  },
  priceSkeleton: {
    height: 18,
    backgroundColor: colors.muted,
    borderRadius: radius.xs,
    marginBottom: spacing.sm,
    width: '40%',
  },
  locSkeleton: {
    height: 14,
    backgroundColor: colors.muted,
    borderRadius: radius.xs,
    width: '60%',
  },
});
