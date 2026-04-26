import { useRouter } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FeedListTemplate } from '@/components/templates/FeedListTemplate';
import { FilterBar } from '@/components/ui/FilterBar';
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
                />
              </View>
              <Touchable
                accessibilityRole="button"
                accessibilityLabel={t('tasker.browse.openFilters')}
                className="items-center justify-center rounded-md border border-border bg-card"
                style={{ width: 48, height: 48 }}
                onPress={() => setIsFilterSheetOpen(true)}
                testID="task-feed-open-filters"
              >
                <SlidersHorizontal size={20} color={colors.primaryDeep} />
              </Touchable>
            </View>
            <Text className="text-caption font-sans-semibold text-text-secondary">
              {t('tasker.browse.resultSummary', { count: filteredTasks.length })}
            </Text>
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
        filterBar={
          <FilterBar
            filters={categories}
            activeFilters={activeFilters}
            onToggle={handleToggleFilter}
            testID="task-feed-filter-bar"
          />
        }
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
