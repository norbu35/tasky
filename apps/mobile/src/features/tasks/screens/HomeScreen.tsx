import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FeedListTemplate } from '@/components/templates/FeedListTemplate';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';
import { CustomerTasksScreen } from '@/features/tasks';
import { TaskFeedCard } from '@/features/tasks/components/TaskFeedCard';
import {
  type PricingModeFilter,
  type ScheduleWindow,
  TaskFeedFilterSheet,
} from '@/features/tasks/components/TaskFeedFilterSheet';
import {
  TaskFeedHeaderTop,
  TaskFeedStickyHeader,
  TaskFeedSubHeader,
} from '@/features/tasks/components/TaskFeedHeader';
import { useCategories } from '@/features/tasks/hooks/useCategories';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import type { TaskFeedItem } from '@/lib/api/types';
import { useRole } from '@/providers/RoleProvider';

import { isWithinScheduleWindow } from './HomeScreen.utils';

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
  const [scheduleWindow, setScheduleWindow] = useState<ScheduleWindow>('any');
  const [pricingMode, setPricingMode] = useState<PricingModeFilter>('any');
  const [budgetRange, setBudgetRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const { data: categoriesData } = useCategories();
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const apiCategories = (categoriesData?.data ?? [])
      .map((cat: { id: string; name?: string; name_mn?: string }) => ({
        id: cat.name?.toLowerCase() ?? cat.id,
        label: cat.name_mn ?? cat.name ?? cat.id,
      }))
      .filter((cat) => {
        if (seen.has(cat.id)) return false;
        seen.add(cat.id);
        return true;
      });
    return [{ id: 'all', label: t('TaskerBrowseScreen.all') }, ...apiCategories];
  }, [categoriesData, t]);

  const sheetCategories = useMemo(() => categories.filter((cat) => cat.id !== 'all'), [categories]);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery('');
    setScheduleWindow('any');
    setPricingMode('any');
    setBudgetRange({ min: null, max: null });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const filteredTasks = useMemo(() => {
    const tasks = data?.data ?? [];
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const hasBudgetBounds = budgetRange.min != null || budgetRange.max != null;
    return tasks.filter((task) => {
      const matchesCategory =
        activeFilters.length === 0 ||
        activeFilters.includes('all') ||
        (task.category && activeFilters.includes(task.category.name.toLowerCase()));
      const matchesSearch =
        normalizedSearch.length === 0 ||
        task.description.toLowerCase().includes(normalizedSearch) ||
        task.category.name.toLowerCase().includes(normalizedSearch) ||
        task.approximate_location.toLowerCase().includes(normalizedSearch);
      const matchesSchedule = isWithinScheduleWindow(task.scheduled_at, scheduleWindow);
      const matchesPricingMode = pricingMode === 'any' || task.pricing_mode === pricingMode;
      let matchesBudget = true;
      if (hasBudgetBounds) {
        if (task.budget == null) {
          matchesBudget = false;
        } else {
          if (budgetRange.min != null && task.budget < budgetRange.min) matchesBudget = false;
          if (budgetRange.max != null && task.budget > budgetRange.max) matchesBudget = false;
        }
      }
      return (
        matchesCategory && matchesSearch && matchesSchedule && matchesPricingMode && matchesBudget
      );
    });
  }, [data, activeFilters, searchQuery, scheduleWindow, pricingMode, budgetRange]);

  const trimmedSearchQuery = searchQuery.trim();
  const selectedFilterItems = useMemo(() => {
    const items: Array<{ id: string; label: string }> = [];
    activeFilters.forEach((id) => {
      const label = categories.find((category) => category.id === id)?.label;
      if (label) items.push({ id, label });
    });
    if (scheduleWindow !== 'any') {
      const labelMap: Record<Exclude<ScheduleWindow, 'any'>, string> = {
        today: t('tasker.browse.scheduleToday'),
        tomorrow: t('tasker.browse.scheduleTomorrow'),
        'this-week': t('tasker.browse.scheduleThisWeek'),
      };
      items.push({ id: `schedule:${scheduleWindow}`, label: labelMap[scheduleWindow] });
    }
    if (pricingMode !== 'any') {
      const label =
        pricingMode === 'BUDGET'
          ? t('tasker.browse.pricingBudget')
          : t('tasker.browse.pricingQuote');
      items.push({ id: `pricing:${pricingMode}`, label });
    }
    if (budgetRange.min != null || budgetRange.max != null) {
      const min = budgetRange.min != null ? `₮${budgetRange.min.toLocaleString('en-US')}` : '';
      const max = budgetRange.max != null ? `₮${budgetRange.max.toLocaleString('en-US')}` : '';
      items.push({ id: 'budget', label: min && max ? `${min}–${max}` : min || max });
    }
    return items;
  }, [activeFilters, categories, scheduleWindow, pricingMode, budgetRange, t]);

  const hasActiveBrowseFilters = selectedFilterItems.length > 0 || trimmedSearchQuery.length > 0;
  const activeFilterCount = selectedFilterItems.length + (trimmedSearchQuery ? 1 : 0);

  const handleToggleFilter = useCallback((id: string) => {
    if (id.startsWith('schedule:')) {
      setScheduleWindow('any');
      return;
    }
    if (id.startsWith('pricing:')) {
      setPricingMode('any');
      return;
    }
    if (id === 'budget') {
      setBudgetRange({ min: null, max: null });
      return;
    }
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
          <TaskFeedHeaderTop hasPending={hasPending} oldestPending={oldestPending} />
        }
        StickyHeaderComponent={
          <TaskFeedStickyHeader
            activeFilterCount={activeFilterCount}
            categories={categories}
            activeFilters={activeFilters}
            searchQuery={searchQuery}
            onOpenFilters={() => setIsFilterSheetOpen(true)}
            onSearchChange={setSearchQuery}
            onToggleFilter={handleToggleFilter}
          />
        }
        SubHeaderComponent={
          <TaskFeedSubHeader
            hasActiveBrowseFilters={hasActiveBrowseFilters}
            resultCount={filteredTasks.length}
            selectedFilterItems={selectedFilterItems}
            trimmedSearchQuery={trimmedSearchQuery}
            onClearFilters={handleClearFilters}
            onClearSearch={handleClearSearch}
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
        categories={sheetCategories}
        activeFilters={activeFilters}
        resultCount={filteredTasks.length}
        scheduleWindow={scheduleWindow}
        onScheduleWindowChange={setScheduleWindow}
        pricingMode={pricingMode}
        onPricingModeChange={setPricingMode}
        minBudget={budgetRange.min}
        maxBudget={budgetRange.max}
        onBudgetChange={setBudgetRange}
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
