import { SlidersHorizontal } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Touchable } from '@/components/ui/Touchable';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { mobileTheme } from '@/design/tokenAdapter';
import { NotificationBellButton } from '@/features/notifications/components/NotificationBellButton';
import { ReviewGateBanner } from '@/features/review/components/ReviewGateBanner';
import { getTaskVisual } from '@/features/tasks/components/CustomerTasksView';
import type { PendingReview } from '@/lib/api/types';

const { colors } = mobileTheme;

interface CategoryTab {
  id: string;
  label: string;
}

/** Single category tab with icon + label + active underline. */
function CategoryTabItem({
  category,
  isActive,
  onPress,
}: {
  category: CategoryTab;
  isActive: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const visual = getTaskVisual(category.id === 'all' ? undefined : category.label, t);
  const Icon = visual.Icon;

  return (
    <Touchable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={category.label}
      onPress={onPress}
      className="items-center pt-sm pb-xs"
      style={{ minWidth: 64 }}
      testID={`task-feed-category-tab-${category.id}`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-xs"
        style={{
          backgroundColor: isActive ? `${visual.tint}18` : 'transparent',
        }}
      >
        <Icon size={20} color={isActive ? visual.tint : colors.textTertiary} />
      </View>
      <Text
        className={
          isActive
            ? 'text-micro font-sans-bold text-foreground'
            : 'text-micro font-sans text-text-secondary'
        }
        numberOfLines={1}
      >
        {category.label}
      </Text>
      {/* Active underline indicator */}
      <View
        className="mt-xs rounded-full"
        style={{
          height: 2,
          width: 24,
          backgroundColor: isActive ? colors.foreground : 'transparent',
        }}
      />
    </Touchable>
  );
}

interface TaskFeedHeaderTopProps {
  hasPending: boolean;
  oldestPending: PendingReview | null;
}

export function TaskFeedHeaderTop({ hasPending, oldestPending }: TaskFeedHeaderTopProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-md pb-sm">
      <ScreenHeader
        title={t('tasker.browse.title')}
        subtitle={t('tasker.browse.subtitle')}
        rightSlot={<NotificationBellButton testID="task-feed-notifications" />}
      />
      {hasPending && oldestPending ? <ReviewGateBanner pendingReview={oldestPending} /> : null}
    </View>
  );
}

interface TaskFeedStickyHeaderProps {
  activeFilterCount: number;
  categories: CategoryTab[];
  activeFilters: string[];
  searchQuery: string;
  onOpenFilters: () => void;
  onSearchChange: (value: string) => void;
  onToggleFilter: (id: string) => void;
}

export function TaskFeedStickyHeader({
  activeFilterCount,
  categories,
  activeFilters,
  searchQuery,
  onOpenFilters,
  onSearchChange,
  onToggleFilter,
}: TaskFeedStickyHeaderProps) {
  const { t } = useTranslation();
  const noCategorySelected = activeFilters.length === 0;

  return (
    <View className="bg-background gap-md pb-sm pt-xs z-10">
      <SearchBar
        elevated
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder={t('tasker.browse.searchPlaceholder')}
        testID="task-feed-search"
      />
      <View className="flex-row items-stretch border-b border-border">
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('tasker.browse.openFilters')}
          className="items-center justify-center pt-sm pb-md pr-sm pl-xs"
          style={{ minWidth: 56 }}
          onPress={onOpenFilters}
          testID="task-feed-open-filters"
        >
          <View className="w-10 h-10 rounded-full items-center justify-center border border-border bg-card">
            <SlidersHorizontal size={18} color={colors.primaryDeep} />
            {activeFilterCount > 0 ? (
              <View
                className="absolute -right-1 -top-1 min-w-[18px] h-[18px] rounded-full bg-primary-deep items-center justify-center px-xs"
                testID="task-feed-filter-count"
              >
                <Text className="text-micro font-sans-bold text-primary-foreground">
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-micro font-sans text-text-secondary mt-xs" numberOfLines={1}>
            {t('tasker.browse.openFiltersShort')}
          </Text>
        </Touchable>

        <View className="flex-1">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-sm items-end pr-md"
            testID="task-feed-category-tabs"
          >
            {categories.map((cat) => {
              const isActive =
                cat.id === 'all' ? noCategorySelected : activeFilters.includes(cat.id);
              return (
                <CategoryTabItem
                  key={cat.id}
                  category={cat}
                  isActive={isActive}
                  onPress={() => onToggleFilter(cat.id)}
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

interface TaskFeedSubHeaderProps {
  resultCount: number;
  hasActiveBrowseFilters: boolean;
  selectedFilterItems: Array<{ id: string; label: string }>;
  trimmedSearchQuery: string;
  onClearFilters: () => void;
  onClearSearch: () => void;
  onToggleFilter: (id: string) => void;
}

export function TaskFeedSubHeader({
  resultCount,
  hasActiveBrowseFilters,
  selectedFilterItems,
  trimmedSearchQuery,
  onClearFilters,
  onClearSearch,
  onToggleFilter,
}: TaskFeedSubHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-md pb-md pt-sm">
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
