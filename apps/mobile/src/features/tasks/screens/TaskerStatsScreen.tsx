import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { StatCard } from '@/components/ui/StatCard';
import { mobileTheme } from '@/design/tokenAdapter';
import { useMyStats } from '@/features/profile/hooks/useMyStats';

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
  const jobsCompleted = readNumber(rawStats['jobs_completed']);
  const averageRating = readNumber(rawStats['average_rating']);
  const responseTimeMinutes = readNumber(rawStats['response_time_minutes']);
  const reliabilityScore = readNumber(rawStats['reliability_score']);
  const completionRate = readNumber(rawStats['completion_rate']);
  const cancellations30d = readNumber(rawStats['cancellations_30d']) ?? 0;
  const ratingBreakdown = (rawStats['rating_breakdown'] ?? {}) as Record<string, unknown>;
  const taskClarity = readNumber(ratingBreakdown['task_clarity']);
  const respectfulness = readNumber(ratingBreakdown['respectfulness']);
  const punctuality = readNumber(ratingBreakdown['punctuality']);
  const isPro = Boolean(rawStats['is_pro']);

  return (
    <DetailTemplate testID="SCR-TASK-016" isLoading={isLoading} isError={isError} onRetry={refetch}>
      {data &&
        (() => {
          const isNewTasker = (jobsCompleted ?? 0) === 0;
          return (
            <View className="gap-lg">
              <View
                className="bg-primary-deep rounded-lg gap-xs"
                style={{ padding: spacing.xl }}
                testID="tasker-stats-hero"
              >
                <Text className="text-label text-primary-foreground opacity-90">
                  {t('tasker.stats.heroLabel')}
                </Text>
                <Text className="text-heroTitle font-bold text-secondary">
                  {isNewTasker ? '🆕' : formatRating(averageRating)}
                </Text>
                <Text className="text-caption text-primary-foreground">
                  {isNewTasker ? t('tasker.stats.newTaskerHint') : t('tasker.stats.heroMeta')}
                </Text>
              </View>

              {/* Your Performance */}
              <Text className="text-heading font-bold text-primary-deep">
                {t('tasker.stats.sectionHeading')}
              </Text>

              <View className="flex-row gap-md">
                <StatCard
                  value={String(jobsCompleted ?? 0)}
                  label={t('tasker.stats.jobsCompleted')}
                />
                <StatCard
                  value={isNewTasker ? '—' : formatRating(averageRating)}
                  label={t('tasker.stats.averageRating')}
                />
              </View>
              <View className="flex-row gap-md">
                <StatCard
                  value={isNewTasker ? '—' : formatPercent(completionRate)}
                  label={t('tasker.stats.completionRate')}
                />
                <StatCard
                  value={responseTimeMinutes == null ? '—' : `${responseTimeMinutes} мин`}
                  label={t('tasker.stats.responseTime')}
                />
              </View>

              {/* Rating Breakdown — hidden for new taskers */}
              {!isNewTasker && (
                <View className="gap-xs pt-md">
                  <Text className="text-subtitle font-semibold text-primary-deep">
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
              )}

              {/* Your Reliability — hidden for new taskers */}
              {!isNewTasker && (
                <View className="gap-xs pt-md">
                  <Text className="text-subtitle font-semibold text-primary-deep">
                    {t('tasker.stats.reliabilityHeading')}
                  </Text>
                  <View className="flex-row gap-md">
                    <StatCard
                      value={String(cancellations30d)}
                      label={t('tasker.stats.cancellations30d')}
                    />
                    <StatCard
                      value={formatPercent(reliabilityScore)}
                      label={t('tasker.stats.reliabilityScore')}
                    />
                  </View>
                  <Text className="text-body text-foreground leading-relaxed mt-sm">
                    {isPro ? t('tasker.stats.proBadgeEarned') : t('TaskerStatsScreen.copy2')}
                  </Text>
                </View>
              )}
            </View>
          );
        })()}
    </DetailTemplate>
  );
}
