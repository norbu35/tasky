import React from 'react';
import {
  ScrollView,
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

  return (
    <ScrollView
      className={className ?? 'flex-1'}
      {...scrollProps}
      contentContainerStyle={[
        { flexGrow: 1 },
        { paddingBottom: insets.bottom + extraBottomInset + mobileTheme.spacing.lg },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}
