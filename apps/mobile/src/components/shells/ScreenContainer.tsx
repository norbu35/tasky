import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  SafeAreaView,
  type Edge,
  type SafeAreaViewProps,
} from 'react-native-safe-area-context';
import { mobileTheme } from '../../design/tokenAdapter';

type ScreenContainerProps = {
  children: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ReadonlyArray<Edge>;
} & Pick<SafeAreaViewProps, 'mode'>;

export function ScreenContainer({
  children,
  testID,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
  mode = 'padding',
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      style={[styles.safeArea, style]}
      edges={edges}
      mode={mode}
      testID={testID}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background,
  },
});

