import { Calendar, MapPin, Star, Tag } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { mobileTheme } from '@/design/tokenAdapter';
import { getTaskVisual } from '@/features/tasks/components/CustomerTasksView';
import type { PublicTask, TaskDetail } from '@/lib/api/types';
import { formatFullDate } from '@/utils/formatDate';

const { colors } = mobileTheme;

interface TaskDetailSummaryProps {
  task: TaskDetail;
  isQuoteMode: boolean;
}

function getPublicCustomer(task: TaskDetail): PublicTask['customer'] | null {
  return 'customer' in task ? (task.customer ?? null) : null;
}

function getLocationText(task: TaskDetail): string | null {
  if ('location_text' in task) return task.location_text;
  return task.approximate_location;
}

export function TaskDetailSummary({ task, isQuoteMode }: TaskDetailSummaryProps) {
  const { t } = useTranslation();
  const customer = getPublicCustomer(task);
  const locationText = getLocationText(task);
  const visual = getTaskVisual(task.category?.name, t);
  const Icon = visual.Icon;

  return (
    <>
      {/* Category hero band */}
      <View
        className="rounded-2xl items-center justify-center py-xl gap-sm"
        style={{ backgroundColor: visual.tone }}
      >
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center"
          style={{ backgroundColor: `${visual.tint}28` }}
        >
          <Icon color={visual.tint} size={30} />
        </View>
        {task.category ? (
          <Text className="text-label font-sans-bold" style={{ color: visual.tint }}>
            {task.category.name}
          </Text>
        ) : null}
      </View>

      {/* Task title */}
      <Text className="text-heading font-display-bold text-primary-deep leading-tight">
        {task.description}
      </Text>

      {/* Info rows */}
      <View className="bg-muted rounded-2xl p-lg gap-md">
        {locationText ? (
          <View className="flex-row items-center gap-sm">
            <MapPin size={15} color={colors.primaryDeep} strokeWidth={2} />
            <Text className="text-body text-primary-deep flex-1">{locationText}</Text>
          </View>
        ) : null}

        {task.scheduled_at ? (
          <View className="flex-row items-center gap-sm">
            <Calendar size={15} color={colors.primaryDeep} strokeWidth={2} />
            <Text className="text-body text-primary-deep">{formatFullDate(task.scheduled_at)}</Text>
          </View>
        ) : null}

        <View className="flex-row items-center gap-sm">
          {isQuoteMode ? (
            <>
              <Tag size={15} color={colors.accent} strokeWidth={2} />
              <Text className="text-body font-sans-bold text-accent">
                {t('tasker.taskDetail.quoteMode')}
              </Text>
            </>
          ) : task.budget != null ? (
            <>
              <Tag size={15} color={colors.primaryDeep} strokeWidth={2} />
              <PriceTag amount={task.budget} size="sm" />
            </>
          ) : null}
        </View>
      </View>

      {'approximate_location' in task && task.approximate_location ? (
        <Text className="text-caption text-text-secondary leading-[20px]">
          {t('TaskDetailScreen.copy1')}
        </Text>
      ) : null}

      {/* Customer profile */}
      {customer ? (
        <View className="flex-row items-center gap-md bg-muted rounded-2xl p-lg">
          <ProfileAvatar
            uri={customer.avatar_url ?? undefined}
            name={customer.full_name}
            size="lg"
          />
          <View className="flex-1 gap-xs">
            <Text className="text-subtitle font-sans-bold text-foreground">
              {customer.full_name}
            </Text>
            {customer.rating_avg > 0 ? (
              <View className="flex-row items-center gap-xs">
                <Star size={14} color={colors.accent} fill={colors.accent} />
                <Text className="text-label font-sans-bold text-foreground">
                  {customer.rating_avg.toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );
}
