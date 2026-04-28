import { BlurView } from 'expo-blur';
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevations } from '@/design/elevations';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

type StickyActionBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  className?: string;
  /** When true, adds tab bar clearance to bottom padding automatically. */
  insideTabNavigator?: boolean;
};

const { colors } = mobileTheme;

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
      className={cn('absolute left-0 right-0 bottom-0', className)}
      style={[
        {
          paddingBottom: insets.bottom + screenLayout.actions.barPadding + tabClearance,
          backgroundColor: colors.background,
          zIndex: 10,
        },
        style,
      ]}
      testID={testID}
    >
      <BlurView
        intensity={48}
        tint="light"
        className="absolute inset-0"
        style={[{ backgroundColor: colors.background }]}
      />
      <View className="px-action-bar pt-action-bar" style={[elevations.navBar]}>
        {children}
      </View>
    </View>
  );
}
