import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../../design/tokenAdapter';

type StickyActionBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Extra bottom offset in px — use when rendered inside a Tab navigator to clear the tab bar. */
  extraBottomPadding?: number;
};

export function StickyActionBar({
  children,
  style,
  testID,
  extraBottomPadding = 0,
}: StickyActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + mobileTheme.spacing.md + extraBottomPadding },
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
    paddingHorizontal: mobileTheme.spacing.md,
    paddingTop: mobileTheme.spacing.md,
  },
});
