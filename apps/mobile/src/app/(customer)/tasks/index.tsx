import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, Hammer, Leaf, Package, Plus, Sparkles, Wrench, Zap } from 'lucide-react-native';
import { ListItemCard, PriceTag, StatusBadge } from '../../../components/ui';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useMyTasks } from '../../../features/tasks/hooks/useMyTasks';
import { elevations } from '../../../design/elevations';
import { mobileTheme } from '../../../design/tokenAdapter';
import { screenLayout } from '../../../design/screenLayout';
import { ScreenContainer } from '../../../components/shells';

const { colors } = mobileTheme;

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

function getTaskVisual(categoryName: string | null | undefined, t: (key: string) => string) {
  const name = (categoryName ?? '').toLowerCase();

  if (name.includes('clean') || name.includes(t('MyTasksListScreen.copy1'))) {
    return { Icon: Sparkles, tint: colors.primary, tone: `${colors.primary}14` };
  }
  if (
    name.includes('hand') ||
    name.includes('repair') ||
    name.includes(t('MyTasksListScreen.copy2'))
  ) {
    return { Icon: Wrench, tint: colors.secondary, tone: `${colors.secondary}18` };
  }
  if (name.includes('move') || name.includes(t('MyTasksListScreen.copy3'))) {
    return { Icon: Package, tint: colors.accent, tone: `${colors.accent}18` };
  }
  if (name.includes('garden') || name.includes(t('MyTasksListScreen.copy4'))) {
    return { Icon: Leaf, tint: colors.trust, tone: `${colors.trust}18` };
  }
  if (name.includes('paint') || name.includes(t('MyTasksListScreen.copy5'))) {
    return { Icon: Hammer, tint: colors.primaryDeep, tone: `${colors.primaryDeep}12` };
  }

  return { Icon: Zap, tint: colors.primaryDeep, tone: `${colors.primaryDeep}12` };
}

function TaskCard({ task, onPress }: { task: TaskLike; onPress: () => void }) {
  const { t } = useTranslation();
  const status = mapStatus(task.status ?? 'open');
  const visual = getTaskVisual(task.category?.name, t);
  const Icon = visual.Icon;

  return (
    <View className="mx-screen-x">
      <ListItemCard
        testID={`task-card-${task.id}`}
        onPress={onPress}
        icon={
          <View
            className="w-12 h-12 rounded-md items-center justify-center"
            style={{ backgroundColor: visual.tone }}
          >
            <Icon color={visual.tint} size={24} />
          </View>
        }
        badge={
          <View className="flex-row items-center justify-between gap-sm">
            <View
              className="self-start px-sm py-xs rounded-full shrink"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Text
                className="text-micro font-sans-bold tracking-widest uppercase text-primary-deep"
                numberOfLines={1}
              >
                {task.category?.name ?? t('customer.taskList.categoryFallback')}
              </Text>
            </View>
            <StatusBadge status={status} />
          </View>
        }
        title={task.description ?? t('customer.taskList.noTitle')}
        trailing={<PriceTag amount={task.budget ?? 0} size="sm" />}
      />
    </View>
  );
}

function SkeletonCard() {
  return (
    <View className="mx-screen-x">
      <View className="bg-card rounded-lg p-lg flex-row gap-md items-start" style={elevations.soft}>
        <View className="w-12 h-12 rounded-md bg-muted shrink-0" />
        <View className="flex-1 gap-sm pt-xs">
          <View className="h-2.5 rounded-full bg-muted w-2/5" />
          <View className="h-4 rounded-full bg-muted w-11/12" />
          <View className="h-3 rounded-full bg-muted w-3/4" />
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
    <View className="px-screen-x pt-header-top pb-header-bottom gap-item">
      <ScreenHeader
        greeting={t('customer.taskList.greeting')}
        title={t('customer.taskList.title')}
        rightSlot={
          <Pressable
            className="w-11 h-11 rounded-full items-center justify-center bg-muted"
            style={elevations.soft}
            onPress={onNotificationsPress}
            testID="my-tasks-notifications"
            accessibilityRole="button"
            accessibilityLabel={t('shared.notifications.title')}
          >
            <Bell size={20} color={colors.primary} />
          </Pressable>
        }
      />

      <View className="rounded-lg p-card gap-item bg-card" style={elevations.soft}>
        <Text className="text-subtitle font-extrabold text-primary-deep">
          {t('customer.taskList.heroEyebrow')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('customer.taskList.heroTitle')}
        </Text>
        <View className="flex-row gap-sm">
          {(
            [
              { key: 'open', label: t('customer.taskList.filterOpen') },
              { key: 'assigned', label: t('customer.taskList.filterAssigned') },
              { key: 'completed', label: t('customer.taskList.filterCompleted') },
            ] as { key: TaskState; label: string }[]
          ).map(({ key, label }) => (
            <View
              key={key}
              className="flex-1 rounded-md py-sm px-sm"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Text className="text-subtitle font-extrabold text-primary-deep">{counts[key]}</Text>
              <Text className="text-caption text-text-secondary">{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function EmptyState({ onPostTask }: { onPostTask: () => void }) {
  const { t } = useTranslation();

  return (
    <View
      className="mx-screen-x mt-block rounded-lg p-section items-center gap-item bg-card"
      style={elevations.soft}
      testID="my-tasks-empty-state"
    >
      <View
        className="w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: `${colors.primary}12` }}
      >
        <Sparkles size={24} color={colors.primary} />
      </View>
      <Text className="text-subtitle font-extrabold text-primary-deep text-center">
        {t('customer.taskList.emptyTitle')}
      </Text>
      <Text className="text-body text-text-secondary text-center leading-relaxed">
        {t('customer.taskList.emptyDescription')}
      </Text>
      <Pressable
        onPress={onPostTask}
        className="min-h-[48px] px-xl rounded-md items-center justify-center bg-primary"
        accessibilityRole="button"
        testID="my-tasks-feed-empty-cta"
      >
        <Text className="text-body font-bold text-primary-foreground">
          {t('customer.taskList.emptyCta')}
        </Text>
      </Pressable>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <View
      className="mx-screen-x mt-block rounded-lg p-section gap-item bg-card"
      style={elevations.soft}
      testID="my-tasks-error-state"
    >
      <Text className="text-subtitle font-extrabold text-primary-deep">
        {t('customer.taskList.errorTitle')}
      </Text>
      <Text className="text-body text-text-secondary leading-relaxed">
        {t('customer.taskList.errorNetwork')}
      </Text>
      <Pressable
        onPress={onRetry}
        className="min-h-[48px] rounded-md items-center justify-center bg-secondary"
        accessibilityRole="button"
        testID="my-tasks-feed-error-cta"
      >
        <Text className="text-body font-bold text-secondary-foreground">
          {t('common.tryAgain')}
        </Text>
      </Pressable>
    </View>
  );
}

export default function MyTasksListScreen() {
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

  const fabSize = screenLayout.chrome.fabSize;

  return (
    <ScreenContainer testID="SCR-CUST-001" padded={false}>
      {isLoading ? (
        <View className="flex-1" testID="my-tasks-loading-state">
          {header}
          <View className="gap-item pt-item">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </View>
        </View>
      ) : isError ? (
        <View className="flex-1">
          {header}
          <ErrorState onRetry={refetch} />
        </View>
      ) : (
        <>
          <FlatList
            className="flex-1"
            data={tasks}
            keyExtractor={(task) => task.id}
            renderItem={({ item }) => (
              <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />
            )}
            ListHeaderComponent={header}
            ListEmptyComponent={<EmptyState onPostTask={handleFabPress} />}
            contentContainerStyle={{
              paddingBottom: screenLayout.chrome.contentBottomClearance,
            }}
            refreshControl={
              <RefreshControl
                refreshing={Boolean(isFetching && !isLoading)}
                onRefresh={refetch}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ItemSeparatorComponent={() => <View className="h-item" />}
            showsVerticalScrollIndicator={false}
            testID="my-tasks-feed"
          />
          {tasks.length > 0 && (
            <Pressable
              testID="my-tasks-feed-fab"
              onPress={handleFabPress}
              accessibilityRole="button"
              accessibilityLabel="Post new task"
              style={[
                {
                  position: 'absolute',
                  right: screenLayout.chrome.fabInsetRight,
                  bottom: screenLayout.chrome.contentBottomClearance,
                  width: fabSize,
                  height: fabSize,
                  borderRadius: fabSize / 2,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                elevations.elevated,
              ]}
            >
              <Plus color={colors.primaryForeground} size={28} />
            </Pressable>
          )}
        </>
      )}
    </ScreenContainer>
  );
}
