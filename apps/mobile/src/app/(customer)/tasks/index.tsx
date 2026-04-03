import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, Hammer, Leaf, Package, Plus, Sparkles, Wrench, Zap } from 'lucide-react-native';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useMyTasks } from '../../../features/tasks/hooks/useMyTasks';
import { elevations } from '../../../design/elevations';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

type TaskState = 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show';

type TaskLike = {
  id: string;
  description?: string | null;
  status?: string | null;
  budget?: number | null;
  scheduled_at?: string | null;
  category?: { name?: string | null } | null;
};

function mapStatus(status: string): TaskState {
  const lower = status.toLowerCase();
  if (lower === 'assigned' || lower === 'tasker_marked_done') return 'assigned';
  if (lower === 'completed') return 'completed';
  if (lower === 'cancelled') return 'cancelled';
  if (lower === 'no_show') return 'no_show';
  return 'open';
}

function formatMoney(amount?: number | null) {
  return `₮${(amount ?? 0).toLocaleString('en-US')}`;
}

function getTaskVisual(categoryName?: string | null) {
  const name = (categoryName ?? '').toLowerCase();

  if (name.includes('clean') || name.includes('цэвэр')) {
    return { Icon: Sparkles, tint: colors.primary, tone: `${colors.primary}14` };
  }
  if (name.includes('hand') || name.includes('repair') || name.includes('зас')) {
    return { Icon: Wrench, tint: colors.secondary, tone: `${colors.secondary}18` };
  }
  if (name.includes('move') || name.includes('зөөв')) {
    return { Icon: Package, tint: colors.accent, tone: `${colors.accent}18` };
  }
  if (name.includes('garden') || name.includes('цэц')) {
    return { Icon: Leaf, tint: colors.trust, tone: `${colors.trust}18` };
  }
  if (name.includes('paint') || name.includes('буд')) {
    return { Icon: Hammer, tint: colors.primaryDeep, tone: `${colors.primaryDeep}12` };
  }

  return { Icon: Zap, tint: colors.primaryDeep, tone: `${colors.primaryDeep}12` };
}

function TaskCard({ task, onPress }: { task: TaskLike; onPress: () => void }) {
  const { t } = useTranslation();
  const status = mapStatus(task.status ?? 'open');
  const visual = getTaskVisual(task.category?.name);
  const Icon = visual.Icon;

  return (
    <View style={styles.cardOuter}>
      <Pressable
        testID={`task-card-${task.id}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={[styles.cardImage, { backgroundColor: visual.tone }]}>
          <Icon color={visual.tint} size={28} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardChip}>
              <Text style={styles.cardChipText} numberOfLines={1}>
                {task.category?.name ?? t('customer.taskList.categoryFallback', 'Task')}
              </Text>
            </View>
            <StatusBadge status={status} />
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {task.description ?? t('customer.taskList.noTitle', 'Untitled task')}
          </Text>
          <Text
            style={styles.cardBudget}
            numberOfLines={1}
            accessibilityLabel={`${(task.budget ?? 0).toLocaleString('en-US')} tugrik`}
          >
            {formatMoney(task.budget)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.cardOuter}>
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonLineXL} />
          <View style={styles.skeletonLineMid} />
        </View>
      </View>
    </View>
  );
}

function Header({
  counts,
  onNotificationsPress,
}: {
  counts: Record<TaskState, number>;
  onNotificationsPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.headerWrap}>
      <View style={styles.topBar}>
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>{t('customer.taskList.greeting', 'Сайн байна уу')}</Text>
          <Text style={styles.pageTitle}>{t('customer.taskList.title', 'Миний даалгаврууд')}</Text>
        </View>
        <Pressable
          style={styles.notificationsButton}
          onPress={onNotificationsPress}
          testID="my-tasks-notifications"
          accessibilityRole="button"
          accessibilityLabel={t('shared.notifications.title', 'Notifications')}
        >
          <Bell size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>
          {t('customer.taskList.heroTitle', 'Таны идэвхтэй даалгаврууд')}
        </Text>
        <Text style={styles.heroBody}>
          {t(
            'customer.taskList.heroBody',
            'Одоо идэвхтэй, хуваарилагдсан, дууссан даалгавруудаа нэг дороос хянаарай.',
          )}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{counts.open}</Text>
            <Text style={styles.statLabel}>{t('customer.taskList.filterOpen', 'Open')}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{counts.assigned}</Text>
            <Text style={styles.statLabel}>
              {t('customer.taskList.filterAssigned', 'Assigned')}
            </Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{counts.completed}</Text>
            <Text style={styles.statLabel}>
              {t('customer.taskList.filterCompleted', 'Completed')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function EmptyState({ onPostTask }: { onPostTask: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyCard} testID="my-tasks-empty-state">
      <View style={styles.emptyBadge}>
        <Sparkles size={24} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{t('customer.taskList.emptyTitle', 'No tasks yet')}</Text>
      <Text style={styles.emptyBody}>
        {t('customer.taskList.emptyDescription', 'Post your first task and find a trusted tasker')}
      </Text>
      <Pressable
        onPress={onPostTask}
        style={styles.emptyCta}
        accessibilityRole="button"
        testID="my-tasks-feed-empty-cta"
      >
        <Text style={styles.emptyCtaText}>{t('customer.taskList.emptyCta', 'Post a Task')}</Text>
      </Pressable>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.errorCard} testID="my-tasks-error-state">
      <Text style={styles.errorTitle}>{t('customer.taskList.errorTitle', 'Network error')}</Text>
      <Text style={styles.errorBody}>
        {t('customer.taskList.errorNetwork', 'Network error. Please try again')}
      </Text>
      <Pressable
        onPress={onRetry}
        style={styles.errorCta}
        accessibilityRole="button"
        testID="my-tasks-feed-error-cta"
      >
        <Text style={styles.errorCtaText}>{t('common.tryAgain', 'Try again')}</Text>
      </Pressable>
    </View>
  );
}

export default function MyTasksListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isFetching, refetch } = useMyTasks();

  const tasks = useMemo(() => {
    return [...((data?.data ?? []) as TaskLike[])].sort((a, b) => {
      const aTime = new Date(a.scheduled_at ?? 0).getTime();
      const bTime = new Date(b.scheduled_at ?? 0).getTime();
      return bTime - aTime;
    });
  }, [data?.data]);

  const counts = useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          const status = mapStatus(task.status ?? 'open');
          acc[status] += 1;
          return acc;
        },
        { open: 0, assigned: 0, completed: 0, cancelled: 0, no_show: 0 } as Record<
          TaskState,
          number
        >,
      ),
    [tasks],
  );

  const handleFabPress = useCallback(() => {
    router.push('/(customer)/tasks/new');
  }, [router]);

  const handleNotificationsPress = useCallback(() => {
    router.push('/(shared)/notifications');
  }, [router]);

  const handleTaskPress = useCallback(
    (taskId: string) => {
      router.push(`/(customer)/tasks/${taskId}`);
    },
    [router],
  );

  const header = useMemo(
    () => <Header counts={counts} onNotificationsPress={handleNotificationsPress} />,
    [counts, handleNotificationsPress],
  );

  return (
    <SafeAreaView style={styles.container} testID="my-tasks-screen">
      {isLoading ? (
        <View style={styles.loadingContainer} testID="my-tasks-loading-state">
          {header}
          <View style={styles.skeletonList}>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </View>
        </View>
      ) : isError ? (
        <View style={styles.screenBody}>
          {header}
          <ErrorState onRetry={refetch} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => (
            <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState onPostTask={handleFabPress} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(isFetching && !isLoading)}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          showsVerticalScrollIndicator={false}
          testID="my-tasks-feed"
        />
      )}

      <Pressable
        onPress={handleFabPress}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        testID="my-tasks-fab"
        accessibilityRole="button"
      >
        <Plus size={20} color={colors.primaryForeground} />
        <Text style={styles.fabLabel}>{t('customer.taskList.fabLabel', 'Post Task')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenBody: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  greeting: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  pageTitle: {
    marginTop: spacing.xs,
    fontSize: 30,
    fontWeight: '900',
    color: colors.primaryDeep,
  },
  notificationsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
    ...elevations.soft,
  },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    gap: spacing.md,
    ...elevations.soft,
  },
  heroTitle: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  heroBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statChip: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    gap: 2,
  },
  statValue: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  statLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  skeletonList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  skeletonCard: {
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    ...elevations.soft,
  },
  skeletonImage: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    flexShrink: 0,
  },
  skeletonContent: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  skeletonLineLong: {
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    width: '75%',
  },
  skeletonLineShort: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    width: '45%',
  },
  skeletonLineXL: {
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    width: '92%',
  },
  skeletonLineMid: {
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    width: '72%',
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    backgroundColor: colors.card,
    alignItems: 'center',
    gap: spacing.md,
    ...elevations.soft,
  },
  emptyBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.5,
  },
  emptyCta: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  emptyCtaText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  errorCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    backgroundColor: colors.card,
    gap: spacing.md,
    ...elevations.soft,
  },
  errorTitle: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  errorBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  errorCta: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  errorCtaText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.secondaryForeground,
  },
  listSeparator: {
    height: spacing.md,
  },
  cardOuter: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: 4,
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    ...elevations.soft,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardImage: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardChip: {
    flex: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}10`,
  },
  cardChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primaryDeep,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDeep,
    lineHeight: 24,
  },
  cardBudget: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.secondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    ...elevations.navBar,
  },
  fabPressed: {
    opacity: 0.92,
  },
  fabLabel: {
    fontSize: typography.body,
    color: colors.primaryForeground,
    fontWeight: '800',
  },
});
