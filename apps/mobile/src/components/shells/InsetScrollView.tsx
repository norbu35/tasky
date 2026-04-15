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
  className?: string;
};

export function InsetScrollView({
  children,
  contentContainerStyle,
  extraBottomInset = 0,
  className,
  ...scrollProps
}: InsetScrollViewProps) {
  const insets = useSafeAreaInsets();

  const flattenedStyle = StyleSheet.flatten(contentContainerStyle) || {};
  const customPaddingBottom =
    typeof flattenedStyle.paddingBottom === 'number' ? flattenedStyle.paddingBottom : 0;

  // Omit paddingBottom from the rest to prevent overriding
  const { paddingBottom: _, ...restStyle } = flattenedStyle;

  return (
    <ScrollView
      className={className ?? 'flex-1'}
      {...scrollProps}
      contentContainerStyle={[
        { flexGrow: 1 },
        restStyle,
        {
          paddingBottom:
            insets.bottom + extraBottomInset + mobileTheme.spacing.lg + customPaddingBottom,
        },
      ]}
    >
      {children}
    </ScrollView>
  );
}
