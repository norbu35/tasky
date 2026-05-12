import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';

import { PriceTag } from '@/components/ui/PriceTag';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme, withAlpha } from '@/design/tokenAdapter';
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

/** Overlay pill badge on the card hero — white bg with translucency. */
function HeroBadge({ label }: { label: string }) {
  return (
    <View
      className="self-start px-md py-xs rounded-full"
      style={{ backgroundColor: withAlpha(colors.card, 0.95) }}
    >
      <Text className="text-caption font-sans-bold text-primary-deep" numberOfLines={1}>
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

  // Using a stable random image based on task ID for the placeholder
  const placeholderUrl = `https://picsum.photos/seed/${task.id}/400/200`;

  const card = (
    <View className="bg-card rounded-2xl overflow-hidden" style={elevations.card}>
      {/* ── Hero Image Area ── */}
      <View className="h-[180px] w-full bg-muted">
        <Image
          source={{ uri: placeholderUrl }}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
        {/* Subtle gradient overlay to ensure text/badges are readable */}
        <LinearGradient
          colors={[withAlpha('#000000', 0.4), 'transparent', withAlpha('#000000', 0.6)]}
          className="absolute inset-0 w-full h-full"
        />

        {/* Overlay badges row */}
        <View className="absolute top-md left-md right-md flex-row justify-between items-start">
          {categoryLabel ? <HeroBadge label={categoryLabel} /> : <View />}
        </View>

        {/* Icon at bottom right of the image */}
        <View
          className="absolute bottom-md right-md w-12 h-12 rounded-xl items-center justify-center shadow-sm"
          style={{ backgroundColor: visual.tone }}
        >
          <Icon color={visual.tint} size={24} />
        </View>
      </View>

      {/* ── Content below hero ── */}
      <View className="p-lg gap-md">
        {/* Title */}
        <Text className="text-h4 font-sans-bold text-primary-deep leading-tight" numberOfLines={2}>
          {decodeDisplayLabel(task.description)}
        </Text>

        {/* Location & Date */}
        <View className="flex-row items-center gap-md">
          {task.approximate_location ? (
            <View className="flex-row items-center gap-xs shrink">
              <MapPin size={14} color={colors.textSecondary} strokeWidth={2.5} />
              <Text className="text-body text-text-secondary" numberOfLines={1}>
                {task.approximate_location}
              </Text>
            </View>
          ) : null}

          {displayDate ? (
            <View className="flex-row items-center gap-xs shrink-0">
              <Calendar size={14} color={colors.textSecondary} strokeWidth={2.5} />
              <Text className="text-body text-text-secondary">{displayDate}</Text>
            </View>
          ) : null}
        </View>

        {/* Price / Quote (More prominent) */}
        <View className="mt-xs pt-md border-t border-border">
          {isQuoteMode ? (
            <Text className="text-h4 font-sans-bold text-accent">
              {t('tasker.browse.quoteRequested')}
            </Text>
          ) : task.budget != null ? (
            <View className="self-start scale-110 origin-left">
              <PriceTag amount={task.budget} size="lg" />
            </View>
          ) : null}
        </View>
      </View>
    </View>
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
