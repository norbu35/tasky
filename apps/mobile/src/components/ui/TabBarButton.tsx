import React from 'react';
import type { AccessibilityState, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';

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
  'aria-selected': _ariaSelected,
  testID,
}: TabBarButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress ?? undefined}
      accessibilityState={accessibilityState}
      android_ripple={null}
      className="flex-1 self-stretch justify-center"
    >
      <View className="items-center justify-center py-xs">{children}</View>
    </Pressable>
  );
}
