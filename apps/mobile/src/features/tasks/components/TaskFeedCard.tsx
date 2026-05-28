import { Calendar, ChevronRight, Clock3, MapPin, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PriceTag } from '@/components/ui/PriceTag';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme, withAlpha } from '@/design/tokenAdapter';
import { getTaskVisual } from '@/features/tasks/components/CustomerTasksView';
import type { TaskFeedItem } from '@/lib/api/types';
import { formatRelativeTime, formatShortDate } from '@/utils/formatDate';

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

function CategoryMark({
  label,
  icon: Icon,
  tint,
  tone,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tint: string;
  tone: string;
}) {
  return (
    <View className="flex-row items-center gap-sm flex-1">
      <View
        className="size-touch-sm rounded-md items-center justify-center"
        style={{ backgroundColor: tone }}
        testID="task-feed-card-category-mark"
      >
        <Icon color={tint} size={18} strokeWidth={2.5} />
      </View>
      <Text className="flex-1 text-caption font-sans-bold text-primary-deep" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function MetadataItem({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-xs max-w-full">
      <Icon size={14} color={colors.textSecondary} strokeWidth={2.4} />
      <Text className="text-caption text-text-secondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface TaskFeedCardProps {
  task: TaskFeedItem;
  onPress?: () => void;
  testID: string;
}

export function TaskFeedCard({ task, onPress, testID }: TaskFeedCardProps) {
  const { i18n, t } = useTranslation();
  const visual = getTaskVisual(task.category?.name, t);
  const Icon = visual.Icon;
  const isQuoteMode = task.pricing_mode === 'QUOTE' || task.budget == null;

  const categoryLabel = task.category ? getCategoryLabel(task.category, i18n.language) : null;

  // Prefer scheduled_at, otherwise fallback to created_at
  const displayDate = task.scheduled_at
    ? formatShortDate(task.scheduled_at)
    : task.created_at
      ? formatShortDate(task.created_at)
      : null;
  const postedAt = task.created_at ? formatRelativeTime(task.created_at, t) : null;

  const card = (
    <Card className="border border-border bg-card">
      <View className="gap-md p-md">
        <View className="flex-row items-start justify-between gap-md">
          {categoryLabel ? (
            <CategoryMark label={categoryLabel} icon={Icon} tint={visual.tint} tone={visual.tone} />
          ) : (
            <View />
          )}
          <View className="items-end shrink-0">
            {isQuoteMode ? (
              <View
                className="rounded-full px-md py-xs"
                style={{ backgroundColor: withAlpha(colors.accent, 0.12) }}
              >
                <Text className="text-caption font-sans-bold text-accent" numberOfLines={1}>
                  {t('tasker.browse.quoteRequested')}
                </Text>
              </View>
            ) : task.budget != null ? (
              <>
                <Text
                  className="text-micro font-sans-semibold text-text-tertiary"
                  numberOfLines={1}
                >
                  {t('tasker.browse.fixedBudget')}
                </Text>
                <PriceTag amount={task.budget} size="sm" />
              </>
            ) : null}
          </View>
        </View>

        <Text className="text-subtitle font-sans-bold text-foreground leading-6" numberOfLines={2}>
          {decodeDisplayLabel(task.description)}
        </Text>

        <View className="flex-row flex-wrap gap-x-md gap-y-xs">
          {task.approximate_location ? (
            <MetadataItem icon={MapPin} label={task.approximate_location} />
          ) : null}
          {displayDate ? (
            <MetadataItem
              icon={Calendar}
              label={t('tasker.browse.scheduledFor', { date: displayDate })}
            />
          ) : null}
          {postedAt ? (
            <MetadataItem icon={Clock3} label={t('tasker.browse.postedAt', { date: postedAt })} />
          ) : null}
        </View>

        <View className="flex-row items-center justify-between gap-md border-t border-border pt-md">
          <View className="flex-row items-center gap-sm flex-1">
            <ShieldCheck size={16} color={colors.primaryDeep} strokeWidth={2.4} />
            <Text className="flex-1 text-caption text-text-secondary leading-5">
              {t('tasker.browse.applyHint')}
            </Text>
          </View>
          {onPress ? <ChevronRight size={18} color={colors.textTertiary} /> : null}
        </View>
      </View>
    </Card>
  );

  if (!onPress) {
    return <View testID={testID}>{card}</View>;
  }

  return (
    <Touchable testID={testID} accessibilityRole="button" onPress={onPress}>
      {card}
    </Touchable>
  );
}
