import { Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CategoryChip } from '@/components/ui/CategoryChip';
import { LocationPin } from '@/components/ui/LocationPin';
import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { mobileTheme } from '@/design/tokenAdapter';
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

  return (
    <>
      {customer ? (
        <View className="flex-row items-center gap-md bg-muted rounded-md p-lg">
          <ProfileAvatar
            uri={customer.avatar_url ?? undefined}
            name={customer.full_name}
            size="lg"
          />
          <View className="flex-1 gap-xs">
            <Text className="text-subtitle font-sans-bold text-foreground">
              {customer.full_name}
            </Text>
            {customer.rating_avg > 0 && (
              <View className="flex-row items-center gap-xs">
                <Star size={16} color={colors.accent} fill={colors.accent} />
                <Text className="text-label font-sans-bold text-foreground">
                  {customer.rating_avg.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}

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

        {locationText && (
          <View className="flex-row items-center justify-between">
            <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
              {t('taskDetails.location')}
            </Text>
            <LocationPin text={locationText} compact />
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

      {'approximate_location' in task && task.approximate_location ? (
        <Text className="text-caption text-text-secondary leading-[20px]">
          {t('TaskDetailScreen.copy1')}
        </Text>
      ) : null}
    </>
  );
}
