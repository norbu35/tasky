import { Search } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';

import { HelpErrorVisual } from './ErrorVisual';

const { colors, spacing, radius, typography } = mobileTheme;

const HELP_SURFACE = {
  searchBarHeight: 44,
  headerHeight: 56,
  faqIconSize: 20,
  searchIconSize: 16,
  loadingRows: 6,
} as const;

export function HelpLoading({ searchPlaceholder }: { searchPlaceholder: string }) {
  return (
    <View testID="SCR-INFRA-005" className="flex-1 px-lg pt-xl">
      <View
        className="min-h-[44px] flex-row items-center gap-sm px-md mb-md"
        style={{ borderRadius: radius.md, backgroundColor: colors.muted }}
      >
        <Search size={HELP_SURFACE.searchIconSize} color={colors.textSecondary} />
        <Text className="flex-1 text-body" style={{ color: colors.textSecondary }}>
          {searchPlaceholder}
        </Text>
      </View>
      <View className="gap-md">
        {Array.from({ length: HELP_SURFACE.loadingRows }).map((_, index) => (
          <View
            key={index}
            className="min-h-[44px] flex-row items-center justify-between px-md py-md"
            style={{ borderRadius: radius.md, backgroundColor: colors.muted }}
          >
            <View
              style={{
                width: '75%',
                height: 16,
                borderRadius: radius.xs,
                backgroundColor: colors.border,
              }}
            />
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: radius.full,
                backgroundColor: colors.border,
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function HelpErrorState({
  headline,
  description,
  retryLabel,
  onRetry,
}: {
  headline: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 px-lg pt-xl items-center">
      <HelpErrorVisual />
      <Text
        className="text-title font-sans-bold text-center mb-sm"
        style={{ color: colors.foreground }}
      >
        {headline}
      </Text>
      <Text
        className="text-body text-center"
        style={{ color: colors.textSecondary, lineHeight: typography.body * 1.6 }}
      >
        {description}
      </Text>
      <Button
        label={retryLabel}
        onPress={onRetry}
        style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
      />
    </View>
  );
}
