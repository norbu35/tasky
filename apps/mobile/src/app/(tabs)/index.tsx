import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react-native';
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

const { colors, spacing, typography } = mobileTheme;

const CATEGORIES = [
  { id: 'all', label: 'Бүгд' },
  { id: 'cleaning', label: 'Цэвэрлэгээ' },
  { id: 'repair', label: 'Засвар' },
  { id: 'moving', label: 'Зөөвөр' },
  { id: 'electrician', label: 'Цахилгаан' },
];

function TaskCardHeader({ task }: { task: PublicTask }) {
  return (
    <View style={styles.cardHeader}>
      <Text style={styles.customerName} numberOfLines={1}>
        {task.customer.full_name}
      </Text>
      <PriceTag amount={task.budget} size="sm" />
    </View>
  );
}

function TaskCardBody({ task }: { task: PublicTask }) {
  return (
    <View style={styles.cardBody}>
      <Text style={styles.taskDescription} numberOfLines={2}>
        {task.description}
      </Text>
      <View style={styles.cardMeta}>
        {task.category && <CategoryChip label={task.category.name} isActive />}
        {task.approximate_location && <LocationPin text={task.approximate_location} compact />}
        {task.scheduled_at && (
          <View style={styles.scheduleRow}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.scheduleText}>
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

export default function FeedScreen() {
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
        <View style={styles.headerContent}>
          <View style={styles.headerCopy}>
            <Text style={styles.screenTitle}>{t('tasker.browse.title', 'Даалгаврууд')}</Text>
            <Text style={styles.screenSubtitle}>
              {t('tasker.browse.subtitle', 'Шинэ даалгаврууд ойрхон')}
            </Text>
          </View>
          <Input
            style={styles.searchInput}
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
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.primaryForeground,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardBody: {
    gap: spacing.sm,
  },
  taskDescription: {
    fontSize: typography.body,
    color: colors.foreground,
    fontWeight: '500',
    lineHeight: typography.body * 1.5,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scheduleText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  headerContent: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  screenSubtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  searchInput: {
    borderWidth: 0,
    borderRadius: mobileTheme.radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.foreground,
    backgroundColor: colors.muted,
  },
});
