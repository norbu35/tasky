import React from 'react';
import type { AccessibilityState, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';
import { cn } from '../../lib/cn';

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
      className="flex-1 self-stretch justify-center mx-md my-sm"
    >
      <View
        className={cn(
          'h-[72px] self-stretch rounded-[20px] items-center justify-center',
          focused && 'bg-primary-deep',
        )}
      >
        {children}
      </View>
    </Pressable>
  );
}
