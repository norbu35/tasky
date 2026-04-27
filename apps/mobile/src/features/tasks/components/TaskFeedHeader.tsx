import { SlidersHorizontal } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Touchable } from '@/components/ui/Touchable';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { mobileTheme } from '@/design/tokenAdapter';
import { ReviewGateBanner } from '@/features/review/components/ReviewGateBanner';
import type { PendingReview } from '@/lib/api/types';

const { colors } = mobileTheme;

interface TaskFeedHeaderProps {
  activeFilterCount: number;
  hasActiveBrowseFilters: boolean;
  hasPending: boolean;
  oldestPending: PendingReview | null;
  resultCount: number;
  searchQuery: string;
  selectedFilterItems: Array<{ id: string; label: string }>;
  trimmedSearchQuery: string;
  onClearFilters: () => void;
  onClearSearch: () => void;
  onOpenFilters: () => void;
  onSearchChange: (value: string) => void;
  onToggleFilter: (id: string) => void;
}

export function TaskFeedHeader({
  activeFilterCount,
  hasActiveBrowseFilters,
  hasPending,
  oldestPending,
  resultCount,
  searchQuery,
  selectedFilterItems,
  trimmedSearchQuery,
  onClearFilters,
  onClearSearch,
  onOpenFilters,
  onSearchChange,
  onToggleFilter,
}: TaskFeedHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-md mb-md">
      <ScreenHeader title={t('tasker.browse.title')} subtitle={t('tasker.browse.subtitle')} />
      {hasPending && oldestPending ? <ReviewGateBanner pendingReview={oldestPending} /> : null}
      <View className="flex-row items-center gap-sm">
        <View className="flex-1">
          <SearchBar
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={t('tasker.browse.searchPlaceholder')}
            testID="task-feed-search"
          />
        </View>
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('tasker.browse.openFilters')}
          className="items-center justify-center rounded-full border border-border bg-card"
          style={{ width: 48, height: 48 }}
          onPress={onOpenFilters}
          testID="task-feed-open-filters"
        >
          <SlidersHorizontal size={20} color={colors.primaryDeep} />
          {activeFilterCount > 0 ? (
            <View
              className="absolute -right-1 -top-1 min-w-[22px] h-[22px] rounded-full bg-primary-deep items-center justify-center px-xs"
              testID="task-feed-filter-count"
            >
              <Text className="text-caption font-sans-bold text-primary-foreground">
                {activeFilterCount}
              </Text>
            </View>
          ) : null}
        </Touchable>
      </View>
      <Text className="text-caption font-sans-semibold text-text-secondary">
        {t('tasker.browse.resultSummary', { count: resultCount })}
      </Text>
      {hasActiveBrowseFilters ? (
        <View className="gap-sm" testID="task-feed-active-filters">
          <View className="flex-row items-center justify-between gap-md">
            <Text className="text-caption font-sans-bold text-foreground">
              {t('tasker.browse.activeFilters')}
            </Text>
            <Touchable
              accessibilityRole="button"
              onPress={onClearFilters}
              testID="task-feed-active-filter-clear"
            >
              <Text className="text-caption font-sans-bold underline text-foreground">
                {t('tasker.browse.clearFilters')}
              </Text>
            </Touchable>
          </View>
          <View className="flex-row flex-wrap gap-sm">
            {trimmedSearchQuery ? (
              <Touchable
                accessibilityRole="button"
                onPress={onClearSearch}
                className="rounded-full border border-border bg-card px-md py-sm"
                testID="task-feed-active-filter-search"
              >
                <Text className="text-caption font-sans-semibold text-foreground">
                  {t('tasker.browse.searchFilterLabel', { query: trimmedSearchQuery })}
                </Text>
              </Touchable>
            ) : null}
            {selectedFilterItems.map((filter) => (
              <Touchable
                key={`${filter.id}-${filter.label}`}
                accessibilityRole="button"
                onPress={() => onToggleFilter(filter.id)}
                className="rounded-full border border-border bg-card px-md py-sm"
                testID={`task-feed-active-filter-${filter.id}`}
              >
                <Text className="text-caption font-sans-semibold text-foreground">
                  {filter.label}
                </Text>
              </Touchable>
            ))}
          </View>
        </View>
      ) : null}
      <TrustBanner title={t('tasker.browse.trustTitle')} description={t('HomeTab.copy1')} />
    </View>
  );
}
