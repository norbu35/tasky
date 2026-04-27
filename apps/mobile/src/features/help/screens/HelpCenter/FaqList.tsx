import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import type { FaqItem, FaqSection } from './model';

const { colors, radius } = mobileTheme;

const HELP_SURFACE = {
  searchBarHeight: 44,
  headerHeight: 56,
  faqIconSize: 20,
  searchIconSize: 16,
  loadingRows: 6,
} as const;

export const SURFACE = HELP_SURFACE;

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
      <Text className="text-label-ui font-display-bold text-primary-deep mb-md">
        {section.title}
      </Text>
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
