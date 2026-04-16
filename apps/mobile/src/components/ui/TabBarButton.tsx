import React from 'react';
import type { AccessibilityState, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing } = mobileTheme;

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

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress ?? undefined}
      accessibilityState={accessibilityState}
      android_ripple={null}
      style={styles.pressable}
    >
      <View style={[styles.content, focused && styles.contentFocused]}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  content: {
    height: 72,
    alignSelf: 'stretch',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentFocused: {
    backgroundColor: colors.primaryDeep,
  },
});
