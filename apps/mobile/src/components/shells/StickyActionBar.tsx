import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenLayout } from '../../design/screenLayout';

type StickyActionBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** When true, adds tab bar clearance to bottom padding automatically. */
  insideTabNavigator?: boolean;
};

export function StickyActionBar({
  children,
  style,
  testID,
  insideTabNavigator = false,
}: StickyActionBarProps) {
  const insets = useSafeAreaInsets();
  const tabClearance = insideTabNavigator
    ? screenLayout.chrome.tabBarHeight + screenLayout.chrome.tabBarBottom
    : 0;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + screenLayout.actions.barPadding + tabClearance },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenLayout.actions.barPadding,
    paddingTop: screenLayout.actions.barPadding,
  },
});
