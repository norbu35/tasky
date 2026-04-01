import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, Plus } from 'lucide-react-native';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { FilterBar } from '../../../components/ui/FilterBar';
import { SplitCard } from '../../../components/ui/SplitCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PriceTag } from '../../../components/ui/PriceTag';
import { useMyTasks } from '../../../features/tasks/hooks/useMyTasks';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'completed', label: 'Completed' },
];

function mapStatus(status: string): 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show' {
  const lower = status.toLowerCase();
  if (lower === 'open') return 'open';
  if (lower === 'assigned') return 'assigned';
  if (lower === 'completed') return 'completed';
  if (lower === 'cancelled') return 'cancelled';
  if (lower === 'no_show') return 'no_show';
  return 'open';
}

export default function MyTasksListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useMyTasks();
  const [activeFilter, setActiveFilter] = useState<string[]>(['all']);

  const tasks = data?.data ?? [];
  const openCount = tasks.filter((task: any) => mapStatus(task.status ?? 'open') === 'open').length;
  const assignedCount = tasks.filter((task: any) => mapStatus(task.status ?? 'open') === 'assigned').length;
  const completedCount = tasks.filter((task: any) => mapStatus(task.status ?? 'open') === 'completed').length;

  const filteredTasks = activeFilter.includes('all')
    ? tasks
    : tasks.filter((task: any) => activeFilter.includes(task.status?.toLowerCase()));

  const handleToggleFilter = useCallback((id: string) => {
    setActiveFilter([id]);
  }, []);

  const handleFabPress = useCallback(() => {
    router.push('/(customer)/tasks/new/category');
  }, [router]);

  const handleNotificationsPress = useCallback(() => {
    router.push('/(shared)/notifications');
  }, [router]);

  const renderTaskCard = useCallback(
    (task: any) => (
      <SplitCard
        testID={`task-card-${task.id}`}
        onPress={() => router.push(`/(customer)/tasks/${task.id}`)}
        headerContent={
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {task.description}
            </Text>
            <PriceTag amount={task.budget ?? 0} size="sm" />
          </View>
        }
        bodyContent={
          <View style={styles.cardBody}>
            {task.category?.name ? (
              <Text style={styles.cardCategory} numberOfLines={1}>
                {task.category.name}
              </Text>
            ) : null}
            <StatusBadge status={mapStatus(task.status ?? 'open')} />
            {task.scheduled_at && (
              <Text style={styles.cardSchedule}>
                {new Date(task.scheduled_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        }
      />
    ),
    [router],
  );

  const filterBar = (
    <FilterBar
      filters={FILTER_TABS.map((f) => ({
        id: f.id,
        label: t(`customer.taskList.filter${f.label}`, f.label),
      }))}
      activeFilters={activeFilter}
      onToggle={handleToggleFilter}
      testID="my-tasks-filter-bar"
    />
  );

  return (
    <View style={styles.container} testID="my-tasks-screen">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('customer.taskList.title', 'My Tasks')}</Text>
        <Pressable
          style={styles.headerAction}
          onPress={handleNotificationsPress}
          testID="my-tasks-notifications"
          accessibilityRole="button"
          accessibilityLabel={t('shared.notifications.title', 'Notifications')}
        >
          <Bell size={22} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>
          {t('customer.taskList.heroEyebrow', 'Your workspace')}
        </Text>
        <Text style={styles.heroTitle}>
          {t('customer.taskList.heroTitle', 'Track active, assigned, and completed work')}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{openCount}</Text>
            <Text style={styles.statLabel}>{t('customer.taskList.filterOpen', 'Open')}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{assignedCount}</Text>
            <Text style={styles.statLabel}>{t('customer.taskList.filterAssigned', 'Assigned')}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>
              {t('customer.taskList.filterCompleted', 'Completed')}
            </Text>
          </View>
        </View>
      </View>
      <FeedListTemplate
        data={filteredTasks}
        renderItem={renderTaskCard}
        keyExtractor={(task: any) => task.id}
        isLoading={isLoading}
        isError={isError}
        isEmpty={tasks.length === 0}
        onRefresh={refetch}
        emptyTitle={t('customer.taskList.emptyTitle', 'No tasks yet')}
        emptyDescription={t(
          'customer.taskList.emptyDescription',
          'Post your first task and find a trusted tasker',
        )}
        emptyCtaLabel={t('customer.taskList.emptyCta', 'Post a Task')}
        emptyCtaOnPress={handleFabPress}
        filterBar={filterBar}
        testID="my-tasks-feed"
      />
      <Pressable
        style={styles.fab}
        onPress={handleFabPress}
        testID="my-tasks-fab"
        accessibilityRole="button"
        accessibilityLabel={t('customer.taskList.emptyCta', 'Post a Task')}
      >
        <Plus size={28} color={colors.primaryForeground} />
        <Text style={styles.fabLabel}>{t('customer.taskList.emptyCta', 'Post a Task')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  heroEyebrow: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  heroTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
    lineHeight: typography.heading * 1.15,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  statChip: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    minHeight: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    shadowColor: mobileTheme.shadows.elevated.color,
    shadowOffset: mobileTheme.shadows.elevated.offset,
    shadowOpacity: mobileTheme.shadows.elevated.opacity,
    shadowRadius: mobileTheme.shadows.elevated.radius,
    elevation: mobileTheme.shadows.elevated.elevation,
    zIndex: 999,
  },
  fabLabel: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryForeground,
    marginRight: spacing.sm,
  },
  cardBody: {
    gap: spacing.sm,
  },
  cardCategory: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.foreground,
  },
  cardSchedule: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
});
