import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FeedListTemplate } from '@/components/templates/FeedListTemplate';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';
import { CustomerTasksScreen } from '@/features/tasks';
import { TaskFeedCard } from '@/features/tasks/components/TaskFeedCard';
import { TaskFeedFilterSheet } from '@/features/tasks/components/TaskFeedFilterSheet';
import { TaskFeedHeader } from '@/features/tasks/components/TaskFeedHeader';
import { useCategories } from '@/features/tasks/hooks/useCategories';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import type { TaskFeedItem } from '@/lib/api/types';
import { useRole } from '@/providers/RoleProvider';

function TaskerBrowseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasPending, isLocked, oldestPending } = useReviewGate();
  const {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasks();

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
        task.category.name.toLowerCase().includes(normalizedSearch) ||
        task.approximate_location.toLowerCase().includes(normalizedSearch);
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
    (task: TaskFeedItem) => {
      if (isLocked) return;
      router.push(`/task/${task.id}` as `${string}`);
    },
    [router, isLocked],
  );

  const renderItem = useCallback(
    (task: TaskFeedItem, index: number) => (
      <View testID={`task-card-index-${index}`}>
        <TaskFeedCard
          task={task}
          onPress={isLocked ? undefined : () => handleTaskPress(task)}
          testID={`task-card-${task.id}`}
        />
      </View>
    ),
    [handleTaskPress, isLocked],
  );

  const keyExtractor = useCallback((task: TaskFeedItem) => task.id, []);
  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
        onEndReached={handleEndReached}
        isLoadingMore={isFetchingNextPage}
        animateItems={false}
        ListHeaderComponent={
          <TaskFeedHeader
            activeFilterCount={activeFilterCount}
            hasActiveBrowseFilters={hasActiveBrowseFilters}
            hasPending={hasPending}
            oldestPending={oldestPending}
            resultCount={filteredTasks.length}
            searchQuery={searchQuery}
            selectedFilterItems={selectedFilterItems}
            trimmedSearchQuery={trimmedSearchQuery}
            onClearFilters={handleClearFilters}
            onClearSearch={handleClearSearch}
            onOpenFilters={() => setIsFilterSheetOpen(true)}
            onSearchChange={setSearchQuery}
            onToggleFilter={handleToggleFilter}
          />
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
