import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { colors, radius, spacing } = mobileTheme;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FABProps = {
  bottomOffset?: number;
  testID?: string;
  authGuard?: boolean;
};

export function FAB({
  bottomOffset = 72,
  testID = 'global-fab',
  authGuard = true,
}: FABProps) {
  const scale = useSharedValue(1);
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (authGuard && !session) {
      router.push('/(auth)');
    } else {
      router.push('/(customer)/tasks/new');
    }
  };

  return (
    <AnimatedPressable
      style={[
        styles.container,
        { bottom: insets.bottom + bottomOffset },
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      testID={testID}
    >
      <Plus color={colors.primaryForeground} size={28} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevations.elevated,
    zIndex: 999,
  },
});
