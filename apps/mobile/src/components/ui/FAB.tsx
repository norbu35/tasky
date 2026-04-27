import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevations } from '@/design/elevations';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme, springs } from '@/design/tokenAdapter';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';

const { colors } = mobileTheme;
const { fabIconSize, fabInsetRight, fabInsetTop, fabSize, tabBarHeight, tabBarBottom } =
  screenLayout.chrome;
const FAB_DRAG_THRESHOLD = 8;
const FAB_Z_INDEX = 999;

type FABProps = {
  testID?: string;
  authGuard?: boolean;
  className?: string;
};

export function FAB({ testID = 'global-fab', authGuard = true, className }: FABProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const { isLocked } = useReviewGate();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Boundaries
  const minX = fabInsetRight;
  const maxX = screenWidth - fabSize - fabInsetRight;
  const minY = insets.top + fabInsetTop;
  const maxY = screenHeight - insets.bottom - tabBarHeight - tabBarBottom - fabSize;

  // Default position: bottom-right, resting at the lowest safe position above the tab bar
  const defaultX = maxX;
  const defaultY = maxY;

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

  const tap = Gesture.Tap().onEnd(() => {
    if (!isDragging.value) {
      runOnJS(navigateToNewTask)();
    }
  });

  const pan = Gesture.Pan()
    .minDistance(FAB_DRAG_THRESHOLD)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      isDragging.value = false;
      scale.value = withSpring(0.95, springs.floating);
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
      translateX.value = withSpring(snapX, springs.floating);
      scale.value = withSpring(1, springs.floating);
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

  if (isLocked) {
    return null;
  }

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: fabSize,
            height: fabSize,
            zIndex: FAB_Z_INDEX,
          },
          animatedStyle,
        ]}
        testID={testID}
      >
        <View
          className={cn('h-full w-full items-center justify-center', className)}
          style={styles.surface}
          pointerEvents="none"
        >
          <Plus color="#FFFFFF" size={fabIconSize} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 12,
    backgroundColor: colors.sunLight,
    ...elevations.elevated,
  },
});
