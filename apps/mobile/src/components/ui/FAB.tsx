// apps/mobile/src/components/ui/FAB.tsx
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { screenLayout } from '../../design/screenLayout';

const { colors, radius } = mobileTheme;
const { fabSize, fabInsetRight, fabBottom, tabBarHeight, tabBarBottom } = screenLayout.chrome;
const DRAG_THRESHOLD = 8;
const SPRING_CONFIG = { damping: 18, stiffness: 220 };

type FABProps = {
  testID?: string;
  authGuard?: boolean;
};

export function FAB({ testID = 'global-fab', authGuard = true }: FABProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Default position: bottom-right, above tab bar
  const defaultX = screenWidth - fabSize - fabInsetRight;
  const defaultY = screenHeight - insets.bottom - fabBottom - fabSize;

  // Boundaries
  const minX = fabInsetRight;
  const maxX = screenWidth - fabSize - fabInsetRight;
  const minY = insets.top + mobileTheme.spacing.md;
  const maxY = screenHeight - insets.bottom - tabBarHeight - tabBarBottom - fabSize;

  const translateX = useSharedValue(defaultX);
  const translateY = useSharedValue(defaultY);
  const startX = useSharedValue(defaultX);
  const startY = useSharedValue(defaultY);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const navigateToNewTask = () => {
    if (authGuard && !session) {
      router.push('/(auth)');
    } else {
      router.push('/(customer)/tasks/new');
    }
  };

  const tap = Gesture.Tap()
    .onEnd(() => {
      if (!isDragging.value) {
        runOnJS(navigateToNewTask)();
      }
    });

  const pan = Gesture.Pan()
    .minDistance(DRAG_THRESHOLD)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      isDragging.value = false;
      scale.value = withSpring(0.95, SPRING_CONFIG);
    })
    .onUpdate((event) => {
      isDragging.value = true;
      const newX = startX.value + event.translationX;
      const newY = startY.value + event.translationY;
      translateX.value = Math.max(minX, Math.min(maxX, newX));
      translateY.value = Math.max(minY, Math.min(maxY, newY));
    })
    .onEnd(() => {
      // Snap to nearest horizontal edge
      const midX = screenWidth / 2;
      const snapX = translateX.value + fabSize / 2 < midX ? minX : maxX;
      translateX.value = withSpring(snapX, SPRING_CONFIG);
      scale.value = withSpring(1, SPRING_CONFIG);
      isDragging.value = false;
    });

  const composed = Gesture.Race(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.fab, animatedStyle]} testID={testID}>
        <Plus color={colors.primaryForeground} size={28} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: fabSize,
    height: fabSize,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevations.elevated,
    zIndex: 999,
  },
});
