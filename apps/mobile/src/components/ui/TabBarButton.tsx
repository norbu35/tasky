import React from 'react';
import type { AccessibilityState, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { interactiveStates, withInteractiveSpring } from '../../design/animations';
import { screenLayout } from '../../design/screenLayout';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing } = mobileTheme;
const { tabButtonHeight, tabButtonInsetX, tabButtonRadius } = screenLayout.chrome;
const AnimatedView = Animated.View;

interface TabBarButtonProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  accessibilityState?: AccessibilityState;
  'aria-selected'?: boolean;
  testID?: string;
}

export function TabBarButton({
  children,
  style: _style,
  onPress,
  onLongPress,
  accessibilityState,
  'aria-selected': ariaSelected,
  testID,
}: TabBarButtonProps) {
  const focused = accessibilityState?.selected ?? ariaSelected ?? false;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress ?? undefined}
      accessibilityState={accessibilityState}
      android_ripple={null}
      style={styles.pressable}
      onPressIn={() => {
        scale.value = withInteractiveSpring(interactiveStates.pressed.scale);
      }}
      onPressOut={() => {
        scale.value = withInteractiveSpring(1);
      }}
    >
      <AnimatedView style={animatedStyle}>
        <View style={[styles.content, focused && styles.contentFocused]}>{children}</View>
      </AnimatedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginHorizontal: tabButtonInsetX,
    marginVertical: spacing.sm,
  },
  content: {
    height: tabButtonHeight,
    alignSelf: 'stretch',
    borderRadius: tabButtonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentFocused: {
    backgroundColor: colors.primaryDeep,
  },
});
