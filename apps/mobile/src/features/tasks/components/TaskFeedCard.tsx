import { Clock, FileText } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CategoryChip } from '@/components/ui/CategoryChip';
import { LocationPin } from '@/components/ui/LocationPin';
import { PriceTag } from '@/components/ui/PriceTag';
import { SplitCard } from '@/components/ui/SplitCard';
import { mobileTheme } from '@/design/tokenAdapter';
import type { TaskFeedItem } from '@/lib/api/types';
import { formatShortDate } from '@/utils/formatDate';

const { colors } = mobileTheme;

function TaskCardHeader({ task }: { task: TaskFeedItem }) {
  const { t } = useTranslation();
  const isQuoteMode = task.pricing_mode === 'QUOTE' || task.budget == null;
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 mr-sm gap-sm">
        {task.category && <CategoryChip label={task.category.name} isActive />}
        {isQuoteMode ? (
          <View className="rounded-full bg-sun-light/15 px-sm py-xs">
            <Text className="text-caption font-sans-bold text-sun-light">
              {t('tasker.browse.quoteRequested')}
            </Text>
          </View>
        ) : (
          <PriceTag amount={task.budget} size="sm" />
        )}
      </View>
    </View>
  );
}

function TaskCardBody({ task }: { task: TaskFeedItem }) {
  const { t } = useTranslation();
  return (
    <View className="gap-sm">
      <Text className="text-body font-sans-medium text-foreground" numberOfLines={2}>
        {task.description}
      </Text>
      <View className="flex-row flex-wrap items-center gap-sm mt-xs">
        {task.approximate_location && <LocationPin text={task.approximate_location} compact />}
        {task.scheduled_at && (
          <View className="flex-row items-center gap-xs">
            <Clock size={16} color={colors.textSecondary} />
            <Text className="text-caption text-text-secondary">
              {formatShortDate(task.scheduled_at)}
            </Text>
          </View>
        )}
        {task.created_at ? (
          <View className="flex-row items-center gap-xs">
            <FileText size={16} color={colors.textSecondary} />
            <Text className="text-caption text-text-secondary">
              {t('tasker.browse.postedAt', { date: formatShortDate(task.created_at) })}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

interface TaskFeedCardProps {
  task: TaskFeedItem;
  onPress: () => void;
  testID: string;
}

export function TaskFeedCard({ task, onPress, testID }: TaskFeedCardProps) {
  return (
    <SplitCard
      headerContent={<TaskCardHeader task={task} />}
      bodyContent={<TaskCardBody task={task} />}
      onPress={onPress}
      testID={testID}
    />
  );
}
