import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react-native';
import { useRole } from '../../providers/RoleProvider';
import CustomerMyTasks from '../(customer)/tasks/index';
import { FeedListTemplate } from '../../components/templates/FeedListTemplate';
import { SplitCard } from '../../components/ui/SplitCard';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { PriceTag } from '../../components/ui/PriceTag';
import { CategoryChip } from '../../components/ui/CategoryChip';
import { LocationPin } from '../../components/ui/LocationPin';
import { TrustBanner } from '../../components/ui/TrustBanner';
import { useTasks } from '../../features/tasks/hooks/useTasks';
import type { PublicTask } from '../../lib/mobileApiClient';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

const CATEGORIES = [
  { id: 'all', label: 'Бүгд' },
  { id: 'cleaning', label: 'Цэвэрлэгээ' },
  { id: 'repair', label: 'Засвар' },
  { id: 'moving', label: 'Зөөвөр' },
  { id: 'electrician', label: 'Цахилгаан' },
];

function TaskCardHeader({ task }: { task: PublicTask }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className="text-label font-sans-semibold flex-1 mr-sm"
        style={{ color: colors.primaryForeground }}
        numberOfLines={1}
      >
        {task.customer.full_name}
      </Text>
      <PriceTag amount={task.budget} size="sm" />
    </View>
  );
}

function TaskCardBody({ task }: { task: PublicTask }) {
  return (
    <View className="gap-sm">
      <Text
        className="text-body font-sans-medium"
        style={{ color: colors.foreground, lineHeight: undefined }}
        numberOfLines={2}
      >
        {task.description}
      </Text>
      <View className="flex-row flex-wrap items-center gap-sm mt-xs">
        {task.category && <CategoryChip label={task.category.name} isActive />}
        {task.approximate_location && <LocationPin text={task.approximate_location} compact />}
        {task.scheduled_at && (
          <View className="flex-row items-center gap-xs">
            <Clock size={14} color={colors.textSecondary} />
            <Text className="text-caption" style={{ color: colors.textSecondary }}>
              {new Date(task.scheduled_at).toLocaleDateString('en', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function HomeTab() {
  const { isCustomer } = useRole();
  if (isCustomer) return <CustomerMyTasks />;
  return <TaskerBrowseScreen />;
}

function TaskerBrowseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useTasks() as {
    data: { data: PublicTask[]; cursor: { next: string | null; prev: string | null } } | undefined;
    isLoading: boolean;
    isError: boolean;
    isRefetching: boolean;
    refetch: () => void;
  };

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
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
      router.push(`/task/${task.id}` as any);
    },
    [router],
  );

  const renderItem = useCallback(
    (task: PublicTask) => (
      <SplitCard
        headerContent={<TaskCardHeader task={task} />}
        bodyContent={<TaskCardBody task={task} />}
        onPress={() => handleTaskPress(task)}
        testID={`task-card-${task.id}`}
      />
    ),
    [handleTaskPress],
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
            <View className="gap-xs">
              <Text className="text-heading font-sans-extrabold" style={{ color: colors.primaryDeep }}>
                {t('tasker.browse.title', 'Даалгаврууд')}
              </Text>
              <Text className="text-body" style={{ color: colors.textSecondary }}>
                {t('tasker.browse.subtitle', 'Шинэ даалгаврууд ойрхон')}
              </Text>
            </View>
            <Input
              style={{
                borderWidth: 0,
                borderRadius: mobileTheme.radius.md,
                paddingHorizontal: mobileTheme.spacing.md,
                paddingVertical: mobileTheme.spacing.sm,
                fontSize: mobileTheme.typography.body,
                color: colors.foreground,
                backgroundColor: colors.muted,
              }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('tasker.browse.searchPlaceholder', 'Даалгавар хайх...')}
              placeholderTextColor={colors.textTertiary}
            />
            <TrustBanner
              title={t('tasker.browse.trustTitle', 'Баталгаажсан даалгавар гүйцэтгэгч')}
              description={t(
                'tasker.browse.trustDescription',
                'Найдвартай үнэлгээтэй tasker-ууд илүү хурдан ажлаа баталгаажуулдаг.',
              )}
            />
          </View>
        }
        emptyTitle={t('tasker.browse.emptyTitle', 'Одоогоор даалгавар байхгүй байна')}
        emptyDescription={t(
          'tasker.browse.emptyDescription',
          'Шүүлтүүрээ өөрчилж, эсвэл дараа дахин шалгана уу',
        )}
        emptyCtaLabel={t('tasker.browse.emptyCta', 'Шүүлтүүр цэвэрлэх')}
        emptyCtaOnPress={handleClearFilters}
        errorMessage={t('common.error')}
        filterBar={
          <FilterBar
            filters={CATEGORIES}
            activeFilters={activeFilters}
            onToggle={handleToggleFilter}
            testID="task-feed-filter-bar"
          />
        }
        testID="task-feed"
      />
    </View>
  );
}
