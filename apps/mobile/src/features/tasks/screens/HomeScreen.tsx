import { useRouter } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FeedListTemplate } from '@/components/templates/FeedListTemplate';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Touchable } from '@/components/ui/Touchable';
import { TrustBanner } from '@/components/ui/TrustBanner';
import { mobileTheme } from '@/design/tokenAdapter';
import { ReviewGateBanner } from '@/features/review/components/ReviewGateBanner';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';
import { CustomerTasksScreen } from '@/features/tasks';
import { TaskFeedCard } from '@/features/tasks/components/TaskFeedCard';
import { TaskFeedFilterSheet } from '@/features/tasks/components/TaskFeedFilterSheet';
import { useCategories } from '@/features/tasks/hooks/useCategories';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import type { PublicTask } from '@/lib/api/types';
import { useRole } from '@/providers/RoleProvider';

const { colors } = mobileTheme;

function TaskerBrowseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasPending, isLocked, oldestPending } = useReviewGate();
  const { data, isLoading, isError, isRefetching, refetch } = useTasks() as {
    data: { data: PublicTask[]; cursor: { next: string | null; has_more: boolean } } | undefined;
    isLoading: boolean;
    isError: boolean;
    isRefetching: boolean;
    refetch: () => void;
  };

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { data: categoriesData } = useCategories();
  const categories = useMemo(() => {
    const apiCategories = (categoriesData?.data ?? []).map(
      (cat: { id: string; name?: string; name_mn?: string }) => ({
        id: cat.name?.toLowerCase() ?? cat.id,
        label: cat.name_mn ?? cat.name ?? cat.id,
      }),
    );
    return [{ id: 'all', label: t('TaskerBrowseScreen.all') }, ...apiCategories];
  }, [categoriesData, t]);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery('');
    setIsFilterSheetOpen(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const filteredTasks = useMemo(() => {
    const tasks = data?.data ?? [];
    return tasks.filter((task) => {
      const matchesCategory =
        activeFilters.length === 0 ||
        activeFilters.includes('all') ||
        (task.category && activeFilters.includes(task.category.name.toLowerCase()));
      const normalizedSearch = searchQuery.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        task.description.toLowerCase().includes(normalizedSearch) ||
        task.customer.full_name.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [data, activeFilters, searchQuery]);

  const hasActiveBrowseFilters = activeFilters.length > 0 || searchQuery.trim().length > 0;
  const selectedFilterItems = useMemo(
    () =>
      activeFilters
        .map((id) => {
          const label = categories.find((category) => category.id === id)?.label;
          return label ? { id, label } : null;
        })
        .filter((item): item is { id: string; label: string } => Boolean(item)),
    [activeFilters, categories],
  );
  const trimmedSearchQuery = searchQuery.trim();
  const activeFilterCount = selectedFilterItems.length + (trimmedSearchQuery ? 1 : 0);

  const handleToggleFilter = useCallback((id: string) => {
    setActiveFilters((prev) => {
      if (id === 'all') return [];
      const next = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev.filter((f) => f !== 'all'), id];
      return next;
    });
  }, []);

  const handleTaskPress = useCallback(
    (task: PublicTask) => {
      if (isLocked) return;
      router.push(`/task/${task.id}` as `${string}`);
    },
    [router, isLocked],
  );

  const renderItem = useCallback(
    (task: PublicTask, index: number) => (
      <View testID={`task-card-index-${index}`} style={{ opacity: isLocked ? 0.5 : 1 }}>
        <TaskFeedCard
          task={task}
          onPress={() => handleTaskPress(task)}
          testID={`task-card-${task.id}`}
        />
      </View>
    ),
    [handleTaskPress, isLocked],
  );

  const keyExtractor = useCallback((task: PublicTask) => task.id, []);

  return (
    <View testID="SCR-TASK-001" className="flex-1">
      <FeedListTemplate
        data={filteredTasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        isLoading={isLoading}
        isError={isError}
        isEmpty={filteredTasks.length === 0 && !isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        onRetry={refetch}
        ListHeaderComponent={
          <View className="gap-md mb-md">
            <ScreenHeader title={t('tasker.browse.title')} subtitle={t('tasker.browse.subtitle')} />
            {hasPending && oldestPending && <ReviewGateBanner pendingReview={oldestPending} />}
            <View className="flex-row items-center gap-sm">
              <View className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('tasker.browse.searchPlaceholder')}
                  testID="task-feed-search"
                />
              </View>
              <Touchable
                accessibilityRole="button"
                accessibilityLabel={t('tasker.browse.openFilters')}
                className="items-center justify-center rounded-full border border-border bg-card"
                style={{ width: 48, height: 48 }}
                onPress={() => setIsFilterSheetOpen(true)}
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
              {t('tasker.browse.resultSummary', { count: filteredTasks.length })}
            </Text>
            {hasActiveBrowseFilters ? (
              <View className="gap-sm" testID="task-feed-active-filters">
                <View className="flex-row items-center justify-between gap-md">
                  <Text className="text-caption font-sans-bold text-foreground">
                    {t('tasker.browse.activeFilters')}
                  </Text>
                  <Touchable
                    accessibilityRole="button"
                    onPress={handleClearFilters}
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
                      onPress={handleClearSearch}
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
                      onPress={() => handleToggleFilter(filter.id)}
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
        }
        emptyTitle={t('tasker.browse.emptyTitle')}
        emptyDescription={
          hasActiveBrowseFilters ? t('tasker.browse.noResultsRemediation') : t('HomeTab.copy2')
        }
        emptyCtaLabel={t('tasker.browse.emptyCta')}
        emptyCtaOnPress={handleClearFilters}
        errorMessage={t('common.error')}
        testID="task-feed"
      />
      <TaskFeedFilterSheet
        visible={isFilterSheetOpen}
        categories={categories}
        activeFilters={activeFilters}
        resultCount={filteredTasks.length}
        onToggleFilter={handleToggleFilter}
        onClearFilters={handleClearFilters}
        onClose={() => setIsFilterSheetOpen(false)}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { isCustomer } = useRole();
  if (isCustomer) return <CustomerTasksScreen />;
  return <TaskerBrowseScreen />;
}
