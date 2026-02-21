import React from 'react';
import { StyleSheet, Platform, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

const { colors } = mobileTheme;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WalkthroughablePressable = walkthroughable(AnimatedPressable);

export function FAB() {
  const scale = useSharedValue(1);
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

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
    if (!session) {
      router.push('/(auth)');
    } else {
      router.push('/create'); // Routes to the root modal
    }
  };

  return (
    <CopilotStep text="Tap here whenever you need to hire someone!" order={2} name="fab">
      <WalkthroughablePressable
        style={[styles.container, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Plus color={colors.primaryForeground} size={28} />
      </WalkthroughablePressable>
    </CopilotStep>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
});
