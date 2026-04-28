import { X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { FilterBar } from '@/components/ui/FilterBar';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

interface FilterItem {
  id: string;
  label: string;
}

interface TaskFeedFilterSheetProps {
  visible: boolean;
  categories: FilterItem[];
  activeFilters: string[];
  resultCount: number;
  onToggleFilter: (id: string) => void;
  onClearFilters: () => void;
  onClose: () => void;
}

export function TaskFeedFilterSheet({
  visible,
  categories,
  activeFilters,
  resultCount,
  onToggleFilter,
  onClearFilters,
  onClose,
}: TaskFeedFilterSheetProps) {
  const { t } = useTranslation();

  return (
    <ModalSheetTemplate
      isOpen={visible}
      title={t('tasker.browse.filterSheetTitle')}
      onClose={onClose}
      testID="task-feed-filter-sheet"
      titleAlign="center"
      contentClassName="gap-lg"
      headerTrailing={
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-full"
          testID="task-feed-filter-sheet-close"
        >
          <X size={22} color={colors.foreground} />
        </Touchable>
      }
      primaryAction={{
        label: t('tasker.browse.showResults', { count: resultCount }),
        onPress: onClose,
        testID: 'task-feed-filter-sheet-show-results',
      }}
      secondaryAction={{
        label: t('tasker.browse.clearFilters'),
        onPress: onClearFilters,
      }}
    >
      <View className="gap-xs">
        <Text className="text-body font-sans-bold text-foreground">
          {t('tasker.browse.resultCount', { count: resultCount })}
        </Text>
        <Text className="text-caption text-text-secondary leading-5">
          {t('tasker.browse.filterSheetDescription')}
        </Text>
      </View>

      <View className="border-t border-border pt-lg gap-md">
        <Text className="text-body font-sans-bold text-foreground">
          {t('tasker.browse.filterCategory')}
        </Text>
        <FilterBar
          filters={categories}
          activeFilters={activeFilters}
          onToggle={onToggleFilter}
          className="px-0"
          testID="task-feed-filter-sheet-options"
        />
      </View>
    </ModalSheetTemplate>
  );
}
