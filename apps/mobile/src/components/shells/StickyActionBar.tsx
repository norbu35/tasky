import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenLayout } from '../../design/screenLayout';
import { cn } from '../../lib/cn';

type StickyActionBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  className?: string;
  /** When true, adds tab bar clearance to bottom padding automatically. */
  insideTabNavigator?: boolean;
};

export function StickyActionBar({
  children,
  style,
  testID,
  className,
  insideTabNavigator = false,
}: StickyActionBarProps) {
  const insets = useSafeAreaInsets();
  const tabClearance = insideTabNavigator
    ? screenLayout.chrome.tabBarHeight + screenLayout.chrome.tabBarBottom
    : 0;

  return (
    <View
      className={cn('absolute left-0 right-0 bottom-0 px-action-bar pt-action-bar', className)}
      style={[
        { paddingBottom: insets.bottom + screenLayout.actions.barPadding + tabClearance },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
