import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { StatCard } from '../../components/ui/StatCard';
import { useMyStats } from '../../features/profile/hooks/useMyStats';
import { mobileTheme } from '../../design/tokenAdapter';

const { spacing } = mobileTheme;

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function formatPercent(value: number | undefined): string {
  return value == null ? '—' : `${value}%`;
}

function formatRating(value: number | undefined): string {
  return value == null ? '—' : value.toFixed(1);
}

export default function TaskerStatsScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyStats();

  const rawStats = (data ?? {}) as Record<string, unknown>;
  const jobsCompleted = readNumber(rawStats.jobs_completed);
  const averageRating = readNumber(rawStats.average_rating);
  const responseTimeMinutes = readNumber(rawStats.response_time_minutes);
  const reliabilityScore = readNumber(rawStats.reliability_score);
  const completionRate = readNumber(rawStats.completion_rate);
  const applicationSuccessRate = readNumber(rawStats.application_success_rate) ?? completionRate;
  const unlockConversionRate =
    readNumber(rawStats.unlock_conversion_rate) ?? applicationSuccessRate;
  const cancellations30d = readNumber(rawStats.cancellations_30d) ?? 0;
  const ratingBreakdown = (rawStats.rating_breakdown ?? {}) as Record<string, unknown>;
  const taskClarity = readNumber(ratingBreakdown.task_clarity);
  const respectfulness = readNumber(ratingBreakdown.respectfulness);
  const punctuality = readNumber(ratingBreakdown.punctuality);
  const isPro = Boolean(rawStats.is_pro);

  return (
    <DetailTemplate testID="SCR-TASK-016" isLoading={isLoading} isError={isError} onRetry={refetch}>
      {data && (
        <View className="gap-lg">
          <View
            className="bg-primaryDeep rounded-lg gap-xs"
            style={{ padding: spacing.xl }}
            testID="tasker-stats-hero"
          >
            <Text className="text-label text-primaryForeground opacity-90">
              {t('tasker.stats.heroLabel')}
            </Text>
            <Text className="text-heroTitle font-bold text-secondary">
              {formatRating(averageRating)}
            </Text>
            <Text className="text-caption text-primaryForeground">
              {t('tasker.stats.heroMeta')}
            </Text>
          </View>

          <Text className="text-heading font-bold text-primaryDeep">
            {t('tasker.stats.sectionHeading')}
          </Text>

          <View className="flex-row gap-md">
            <StatCard value={String(jobsCompleted ?? 0)} label={t('tasker.stats.jobsCompleted')} />
            <StatCard value={formatRating(averageRating)} label={t('tasker.stats.averageRating')} />
          </View>
          <View className="flex-row gap-md">
            <StatCard
              value={formatPercent(completionRate)}
              label={t('tasker.stats.completionRate')}
            />
            <StatCard
              value={formatPercent(applicationSuccessRate)}
              label={t('tasker.stats.applicationSuccess')}
            />
          </View>
          <View className="flex-row gap-md">
            <StatCard value={String(cancellations30d)} label={t('tasker.stats.cancellations30d')} />
            <StatCard
              value={formatPercent(reliabilityScore)}
              label={t('tasker.stats.reliabilityScore')}
            />
          </View>

          <View className="gap-xs pt-md">
            <Text className="text-subtitle font-semibold text-primaryDeep">
              {t('tasker.stats.ratingBreakdown')}
            </Text>
            <Text className="text-body text-foreground leading-relaxed">
              {t('tasker.stats.taskClarity')}: {taskClarity ?? averageRating ?? '—'}
            </Text>
            <Text className="text-body text-foreground leading-relaxed">
              {t('tasker.stats.respectfulness')}: {respectfulness ?? averageRating ?? '—'}
            </Text>
            <Text className="text-body text-foreground leading-relaxed">
              {t('tasker.stats.punctuality')}: {punctuality ?? averageRating ?? '—'}
            </Text>
          </View>

          <View className="gap-xs pt-md">
            <Text className="text-subtitle font-semibold text-primaryDeep">
              {t('tasker.stats.reliabilityHeading')}
            </Text>
            <Text className="text-body text-foreground leading-relaxed">
              {t('tasker.stats.reliabilityLabel')}: {formatPercent(reliabilityScore)}
            </Text>
            <Text className="text-body text-foreground leading-relaxed">
              {t('TaskerStatsScreen.copy1')}
            </Text>
          </View>

          <View className="gap-xs pt-md">
            <Text className="text-subtitle font-semibold text-primaryDeep">
              {t('tasker.stats.activityHeading')}
            </Text>
            <Text className="text-body text-foreground leading-relaxed">
              {t('tasker.stats.unlockConversion')}: {formatPercent(unlockConversionRate)}
            </Text>
            <Text className="text-body text-foreground leading-relaxed">
              {t('tasker.stats.responseTime')}:{' '}
              {responseTimeMinutes == null ? '—' : `${responseTimeMinutes} мин`}
            </Text>
            <Text className="text-body text-foreground leading-relaxed">
              {isPro ? t('tasker.stats.proBadgeEarned') : t('TaskerStatsScreen.copy2')}
            </Text>
          </View>
        </View>
      )}
    </DetailTemplate>
  );
}
