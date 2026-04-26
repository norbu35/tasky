import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { FilterBar } from '@/components/ui/FilterBar';
import { ModalSheet } from '@/components/ui/ModalSheet';

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
    <ModalSheet
      visible={visible}
      title={t('tasker.browse.filterSheetTitle')}
      onClose={onClose}
      testID="task-feed-filter-sheet"
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
      <Text className="text-body font-sans-bold text-foreground">
        {t('tasker.browse.resultCount', { count: resultCount })}
      </Text>
      <Text className="text-caption text-text-secondary leading-[20px]">
        {t('tasker.browse.filterSheetDescription')}
      </Text>
      <FilterBar
        filters={categories}
        activeFilters={activeFilters}
        onToggle={onToggleFilter}
        className="px-0"
        testID="task-feed-filter-sheet-options"
      />
    </ModalSheet>
  );
}
