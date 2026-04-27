import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ListItemCard, PriceTag, StatusBadge } from '@/components/ui';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { getTaskVisual } from '@/features/tasks/components/CustomerTasksView';

import { type TaskLike, mapStatus } from './model';

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
