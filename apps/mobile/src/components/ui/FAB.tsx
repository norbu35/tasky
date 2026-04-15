// apps/mobile/src/components/ui/FAB.tsx
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevations } from '../../design/elevations';
import { screenLayout } from '../../design/screenLayout';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/authStore';

const { colors } = mobileTheme;
const { fabSize, fabInsetRight, fabBottom, tabBarHeight, tabBarBottom } = screenLayout.chrome;
const DRAG_THRESHOLD = 8;
const SPRING_CONFIG = { damping: 18, stiffness: 220 };

type FABProps = {
  testID?: string;
  authGuard?: boolean;
  className?: string;
};

export function FAB({ testID = 'global-fab', authGuard = true, className }: FABProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

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

  const tap = Gesture.Tap().onEnd(() => {
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
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
            ...elevations.elevated,
          },
          animatedStyle,
        ]}
        className={cn(className)}
        testID={testID}
      >
        <Plus color={colors.primaryForeground} size={28} />
      </Animated.View>
    </GestureDetector>
  );
}
