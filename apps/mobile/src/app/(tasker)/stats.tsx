import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    <DetailTemplate isLoading={isLoading} isError={isError} onRetry={refetch} testID="tasker-stats">
      {data && (
        <View style={styles.content}>
          <View style={styles.heroCard} testID="tasker-stats-hero">
            <Text style={styles.heroLabel}>{t('tasker.stats.heroLabel', 'Таны үнэлгээ')}</Text>
            <Text style={styles.heroValue}>{formatRating(averageRating)}</Text>
            <Text style={styles.heroMeta}>
              {t('tasker.stats.heroMeta', 'Захиалагчийн үнэлгээнээс')}
            </Text>
          </View>

          <Text style={styles.sectionHeading}>
            {t('tasker.stats.sectionHeading', 'Ерөнхий үзүүлэлтүүд')}
          </Text>

          <View style={styles.statsGrid}>
            <StatCard
              value={String(jobsCompleted ?? 0)}
              label={t('tasker.stats.jobsCompleted', 'Дууссан ажил')}
            />
            <StatCard
              value={formatRating(averageRating)}
              label={t('tasker.stats.averageRating', 'Ерөнхий үнэлгээ')}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              value={formatPercent(completionRate)}
              label={t('tasker.stats.completionRate', 'Гүйцэтгэлийн хувь')}
            />
            <StatCard
              value={formatPercent(applicationSuccessRate)}
              label={t('tasker.stats.applicationSuccess', 'Анкетын амжилт')}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              value={String(cancellations30d)}
              label={t('tasker.stats.cancellations30d', 'Цуцлалт (30 хоногт)')}
            />
            <StatCard
              value={formatPercent(reliabilityScore)}
              label={t('tasker.stats.reliabilityScore', 'Найдвартай байдлын оноо')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('tasker.stats.ratingBreakdown', 'Үнэлгээний задаргаа')}
            </Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.taskClarity', 'Даалгаврын тодорхой байдал')}:{' '}
              {taskClarity ?? averageRating ?? '—'}
            </Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.respectfulness', 'Хүндэтгэлтэй хандлага')}:{' '}
              {respectfulness ?? averageRating ?? '—'}
            </Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.punctuality', 'Цаг баримтлал')}:{' '}
              {punctuality ?? averageRating ?? '—'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('tasker.stats.reliabilityHeading', 'Найдвартай байдал')}
            </Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.reliabilityLabel', 'Найдвартай байдлын оноо')}:{' '}
              {formatPercent(reliabilityScore)}
            </Text>
            <Text style={styles.sectionLine}>
              {t(
                'tasker.stats.reliabilityDescription',
                'Гүйцэтгэлийн хувь, цаг баримтлал, үнэлгээ, цуцлалтын түүх дээр суурилсан',
              )}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tasker.stats.activityHeading', 'Идэвхжил')}</Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.unlockConversion', 'Түгжээ тайлалтын хувь')}:{' '}
              {formatPercent(unlockConversionRate)}
            </Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.responseTime', 'Хариу өгөх хугацаа')}:{' '}
              {responseTimeMinutes == null ? '—' : `${responseTimeMinutes} мин`}
            </Text>
            <Text style={styles.sectionLine}>
              {isPro
                ? t('tasker.stats.proBadgeEarned', 'Pro Badge олдсон!')
                : t(
                    'tasker.stats.proBadgeEligible',
                    '15+ ажил, 4.5+ үнэлгээтэй бол Pro Badge авна',
                  )}
            </Text>
          </View>
        </View>
      )}
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: mobileTheme.colors.primaryDeep,
    borderRadius: mobileTheme.radius.lg,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  heroLabel: {
    fontSize: mobileTheme.typography.label,
    color: mobileTheme.colors.primaryForeground,
    opacity: 0.9,
  },
  heroValue: {
    fontSize: mobileTheme.typography.heroTitle,
    fontWeight: '700',
    color: mobileTheme.colors.secondary,
  },
  heroMeta: {
    fontSize: mobileTheme.typography.caption,
    color: mobileTheme.colors.primaryForeground,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: mobileTheme.colors.primaryDeep,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: mobileTheme.typography.subtitle,
    fontWeight: '600',
    color: mobileTheme.colors.primaryDeep,
  },
  sectionLine: {
    fontSize: mobileTheme.typography.body,
    color: mobileTheme.colors.foreground,
    lineHeight: mobileTheme.typography.body * 1.5,
  },
});
