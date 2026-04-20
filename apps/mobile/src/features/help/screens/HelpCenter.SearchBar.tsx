import { Search } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Input } from '@/components/ui/Input';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors, radius } = mobileTheme;

const HELP_SURFACE = {
  searchBarHeight: 44,
  headerHeight: 56,
  faqIconSize: 20,
  searchIconSize: 16,
  loadingRows: 6,
} as const;

export const SURFACE = HELP_SURFACE;

export function HelpSearchBar({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View
      className="min-h-[44px] flex-row items-center gap-sm px-md mx-lg mt-xl mb-md"
      style={{ borderRadius: radius.md, backgroundColor: colors.muted }}
    >
      <Search size={HELP_SURFACE.searchIconSize} color={colors.textSecondary} />
      <Input
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-body py-sm"
        style={{ color: colors.foreground }}
        testID="help-search-input"
      />
    </View>
  );
}
