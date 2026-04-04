import React from 'react';
import {
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../../design/tokenAdapter';

type InsetScrollViewProps = ScrollViewProps & {
  extraBottomInset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function InsetScrollView({
  children,
  contentContainerStyle,
  extraBottomInset = 0,
  ...scrollProps
}: InsetScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      {...scrollProps}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + extraBottomInset + mobileTheme.spacing.lg },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
});

