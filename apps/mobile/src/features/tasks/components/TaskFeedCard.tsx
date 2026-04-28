import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ListItemCard } from '@/components/ui/ListItemCard';
import { PriceTag } from '@/components/ui/PriceTag';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mobileTheme } from '@/design/tokenAdapter';
import { getTaskVisual } from '@/features/tasks/components/CustomerTasksView';
import type { TaskFeedItem } from '@/lib/api/types';
import { formatShortDate } from '@/utils/formatDate';

const { colors } = mobileTheme;

type FeedCategory = NonNullable<TaskFeedItem['category']>;

function decodeDisplayLabel(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getCategoryLabel(category: FeedCategory, language?: string) {
  const localizedName =
    language?.startsWith('mn') && 'name_mn' in category ? category.name_mn : undefined;
  return decodeDisplayLabel(localizedName || category.name);
}

function TaskFeedPill({ label }: { label: string }) {
  return (
    <View
      className="self-start px-sm py-xs rounded-full shrink"
      style={{ backgroundColor: `${colors.primary}14`, maxWidth: 148 }}
    >
      <Text className="text-caption font-sans-bold text-primary-deep" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function TaskCardBadge({ task }: { task: TaskFeedItem }) {
  const { i18n, t } = useTranslation();
  const isQuoteMode = task.pricing_mode === 'QUOTE' || task.budget == null;
  return (
    <View className="flex-row flex-wrap items-start gap-xs">
      {task.category && <TaskFeedPill label={getCategoryLabel(task.category, i18n.language)} />}
      {isQuoteMode ? (
        <View
          className="self-start px-sm py-xs rounded-full shrink"
          style={{ backgroundColor: `${colors.accent}18`, maxWidth: 172 }}
        >
          <Text className="text-caption font-sans-bold text-accent" numberOfLines={1}>
            {t('tasker.browse.quoteRequested')}
          </Text>
        </View>
      ) : (
        <StatusBadge status="open" />
      )}
    </View>
  );
}

function getTaskSubtitle(task: TaskFeedItem, postedAtLabel?: string | null) {
  const parts = [
    task.approximate_location,
    task.scheduled_at ? formatShortDate(task.scheduled_at) : null,
    postedAtLabel,
  ].filter((part): part is string => Boolean(part));
  return parts.join(' · ');
}

interface TaskFeedCardProps {
  task: TaskFeedItem;
  onPress?: () => void;
  testID: string;
}

export function TaskFeedCard({ task, onPress, testID }: TaskFeedCardProps) {
  const { t } = useTranslation();
  const visual = getTaskVisual(task.category?.name, t);
  const Icon = visual.Icon;
  const isQuoteMode = task.pricing_mode === 'QUOTE' || task.budget == null;
  const postedAtLabel = task.created_at
    ? t('tasker.browse.postedAt', { date: formatShortDate(task.created_at) })
    : null;

  return (
    <ListItemCard
      testID={testID}
      onPress={onPress}
      icon={
        <View
          className="w-12 h-12 rounded-md items-center justify-center"
          style={{ backgroundColor: visual.tone }}
        >
          <Icon color={visual.tint} size={24} />
        </View>
      }
      badge={<TaskCardBadge task={task} />}
      title={decodeDisplayLabel(task.description)}
      subtitle={getTaskSubtitle(task, postedAtLabel)}
      trailing={isQuoteMode ? null : <PriceTag amount={task.budget} size="sm" />}
    />
  );
}
