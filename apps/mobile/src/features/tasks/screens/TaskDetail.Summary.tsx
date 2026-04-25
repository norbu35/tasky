import { Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CategoryChip } from '@/components/ui/CategoryChip';
import { LocationPin } from '@/components/ui/LocationPin';
import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { mobileTheme } from '@/design/tokenAdapter';
import type { PublicTask } from '@/lib/api/types';
import { formatFullDate } from '@/utils/formatDate';

const { colors } = mobileTheme;

interface TaskDetailSummaryProps {
  task: PublicTask;
  isQuoteMode: boolean;
}

export function TaskDetailSummary({ task, isQuoteMode }: TaskDetailSummaryProps) {
  const { t } = useTranslation();

  return (
    <>
      <View className="flex-row items-center gap-md bg-muted rounded-md p-lg">
        <ProfileAvatar uri={undefined} name={task.customer.full_name} size="lg" />
        <View className="flex-1 gap-xs">
          <Text className="text-subtitle font-sans-bold text-foreground">
            {task.customer.full_name}
          </Text>
          {task.customer.rating_avg > 0 && (
            <View className="flex-row items-center gap-xs">
              <Star size={16} color={colors.accent} fill={colors.accent} />
              <Text className="text-label font-sans-bold text-foreground">
                {task.customer.rating_avg.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text className="text-heading font-sans-bold text-primary-deep leading-tight">
        {task.description}
      </Text>

      <View className="bg-muted rounded-md p-lg gap-md">
        {task.category && (
          <View className="flex-row items-center justify-between">
            <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
              {t('TaskDetailCustomerScreen.categoryLabel')}
            </Text>
            <CategoryChip label={task.category.name} isActive />
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
            {t('taskDetails.budget')}
          </Text>
          {isQuoteMode ? (
            <Text className="text-label font-sans-bold text-foreground">
              {t('tasker.taskDetail.quoteMode')}
            </Text>
          ) : (
            <PriceTag amount={task.budget} size="sm" />
          )}
        </View>

        {task.approximate_location && (
          <View className="flex-row items-center justify-between">
            <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
              {t('taskDetails.location')}
            </Text>
            <LocationPin text={task.approximate_location} compact />
          </View>
        )}

        {task.scheduled_at && (
          <View className="flex-row items-center justify-between">
            <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
              {t('taskDetail.dateTime')}
            </Text>
            <Text className="text-label font-sans-medium text-foreground">
              {formatFullDate(task.scheduled_at)}
            </Text>
          </View>
        )}
      </View>

      {task.approximate_location && (
        <Text className="text-caption text-text-secondary leading-[20px]">
          {t('TaskDetailScreen.copy1')}
        </Text>
      )}
    </>
  );
}
