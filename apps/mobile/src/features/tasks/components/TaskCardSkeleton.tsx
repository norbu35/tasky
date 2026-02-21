import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors } = mobileTheme;

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
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleSkeleton: {
    height: 20,
    backgroundColor: colors.muted,
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  priceSkeleton: {
    height: 18,
    backgroundColor: colors.muted,
    borderRadius: 4,
    marginBottom: 8,
    width: '40%',
  },
  locSkeleton: {
    height: 14,
    backgroundColor: colors.muted,
    borderRadius: 4,
    width: '60%',
  },
});
