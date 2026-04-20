import { Bell } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ListItemCard, PriceTag, StatusBadge } from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';
import { ReviewGateBanner } from '@/features/review/components/ReviewGateBanner';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';
import { Sparkles } from 'lucide-react-native';

import { type TaskLike, type TaskState, mapStatus, getTaskVisual } from './CustomerTasks.model';

const { colors } = mobileTheme;

export function TaskCard({ task, onPress }: { task: TaskLike; onPress: () => void }) {
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

export function SkeletonCard() {
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

export function Header({
  counts,
  onNotificationsPress,
}: {
  counts: Record<TaskState, number>;
  onNotificationsPress: () => void;
}) {
  const { t } = useTranslation();
  const { hasPending, oldestPending } = useReviewGate();

  return (
    <View className="px-screen-x pt-header-top pb-header-bottom gap-item">
      <ScreenHeader
        greeting={t('customer.taskList.greeting')}
        title={t('customer.taskList.title')}
        rightSlot={
          <Touchable
            className="w-11 h-11 rounded-full items-center justify-center bg-muted"
            style={elevations.soft}
            onPress={onNotificationsPress}
            testID="my-tasks-notifications"
            accessibilityRole="button"
            accessibilityLabel={t('shared.notifications.title')}
          >
            <Bell size={20} color={colors.primary} />
          </Touchable>
        }
      />

      {hasPending && oldestPending && <ReviewGateBanner pendingReview={oldestPending} />}

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

export function EmptyState({ onPostTask }: { onPostTask: () => void }) {
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
      <Touchable
        onPress={onPostTask}
        className="px-xl rounded-md items-center justify-center bg-primary"
        style={{ minHeight: mobileSurfaces.touchTarget.ctaHeight }}
        accessibilityRole="button"
        testID="my-tasks-feed-empty-cta"
      >
        <Text className="text-body font-bold text-primary-foreground">
          {t('customer.taskList.emptyCta')}
        </Text>
      </Touchable>
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
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
      <Touchable
        onPress={onRetry}
        className="rounded-md items-center justify-center bg-secondary"
        style={{ minHeight: mobileSurfaces.touchTarget.ctaHeight }}
        accessibilityRole="button"
        testID="my-tasks-feed-error-cta"
      >
        <Text className="text-body font-bold text-secondary-foreground">
          {t('common.tryAgain')}
        </Text>
      </Touchable>
    </View>
  );
}
