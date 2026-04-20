import { ChevronDown, ChevronUp, Search } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import { HelpErrorVisual } from './HelpCenter.ErrorVisual';
import type { FaqItem, FaqSection } from './HelpCenter.model';

const { colors, spacing, radius, typography } = mobileTheme;

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

export function FaqItemRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: FaqItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <View>
      <Touchable
        className="min-h-[44px] flex-row items-center justify-between p-lg mb-sm"
        style={{ backgroundColor: colors.muted, borderRadius: radius.md }}
        onPress={onToggle}
        testID={`faq-item-${item.id}`}
      >
        <Text className="flex-1 text-body mr-sm" style={{ color: colors.foreground }}>
          {item.question}
        </Text>
        <Icon size={HELP_SURFACE.faqIconSize} color={colors.textSecondary} />
      </Touchable>
      {isExpanded ? (
        <View
          className="p-lg mb-sm"
          style={{ backgroundColor: colors.muted, borderRadius: radius.md }}
          testID={`faq-answer-${item.id}`}
        >
          <Text
            className="text-body"
            style={{ color: colors.textSecondary, lineHeight: mobileSurfaces.paragraphLineHeight }}
          >
            {item.answer}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function CategorySection({
  section,
  expandedId,
  onToggle,
}: {
  section: FaqSection;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <View className="mb-xl">
      <Text className="text-[13px] font-display-bold text-primary-deep mb-md">{section.title}</Text>
      {section.items.map((item) => (
        <FaqItemRow
          key={item.id}
          item={item}
          isExpanded={expandedId === item.id}
          onToggle={() => onToggle(item.id)}
        />
      ))}
    </View>
  );
}
