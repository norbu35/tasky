import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { StatCard } from '../../components/ui/StatCard';
import { useMyStats } from '../../features/profile/hooks/useMyStats';
import { mobileTheme } from '../../design/tokenAdapter';

const { spacing } = mobileTheme;

export default function TaskerStatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useMyStats();

  const stats = data as
    | ({
        jobs_completed: number;
        average_rating: number;
        response_time_minutes: number;
        reliability_score: number;
        completion_rate?: number;
        cancellations_30d?: number;
        rating_breakdown?: {
          task_clarity?: number;
          respectfulness?: number;
          punctuality?: number;
        };
        is_pro?: boolean;
      } & Record<string, unknown>)
    | undefined;

  return (
    <DetailTemplate
      headerTitle={t('tasker.stats.title', 'My Stats')}
      onBack={() => router.back()}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      testID="tasker-stats"
    >
      {stats && (
        <View style={styles.content}>
          <View style={styles.heroCard} testID="tasker-stats-hero">
            <Text style={styles.heroLabel}>{t('tasker.stats.heroLabel', 'Your rating')}</Text>
            <Text style={styles.heroValue}>{stats.average_rating.toFixed(1)}</Text>
            <Text style={styles.heroMeta}>
              {t('tasker.stats.heroMeta', 'From customer reviews')}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              value={String(stats.jobs_completed)}
              label={t('tasker.stats.jobsCompleted', 'Completed Jobs')}
            />
            <StatCard
              value={String(stats.average_rating)}
              label={t('tasker.stats.averageRating', 'Overall Rating')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              value={String(stats.response_time_minutes)}
              label={t('tasker.stats.responseTime', 'Response Time')}
            />
            <StatCard
              value={`${stats.reliability_score}%`}
              label={t('tasker.stats.reliabilityScore', 'Reliability Score')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              value={`${stats.completion_rate ?? stats.reliability_score}%`}
              label={t('tasker.stats.completionRate', 'Completion Rate')}
            />
            <StatCard
              value={String(stats.cancellations_30d ?? 0)}
              label={t('tasker.stats.cancellations30d', 'Cancellations (30d)')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tasker.stats.ratingBreakdown', 'Rating Breakdown')}</Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.taskClarity', 'Task Clarity')}: {stats.rating_breakdown?.task_clarity ?? stats.average_rating}
            </Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.respectfulness', 'Respectfulness')}: {stats.rating_breakdown?.respectfulness ?? stats.average_rating}
            </Text>
            <Text style={styles.sectionLine}>
              {t('tasker.stats.punctuality', 'Punctuality')}: {stats.rating_breakdown?.punctuality ?? stats.average_rating}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tasker.stats.reliabilityHeading', 'Reliability')}</Text>
            <Text style={styles.sectionLine}>
              {t(
                'tasker.stats.reliabilityDescription',
                t('tasker.stats.reliabilityDesc', 'Based on completion rate, punctuality, ratings, and cancellation history'),
              )}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tasker.stats.proBadge', 'Pro Badge')}</Text>
            <Text style={styles.sectionLine}>
              {stats.is_pro
                ? t('tasker.stats.proBadgeEarned', 'Pro Badge earned!')
                : t('tasker.stats.proBadgeEligible', 'Earn Pro Badge with 15+ jobs and 4.5+ rating')}
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
    backgroundColor: mobileTheme.colors.primary,
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
  section: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: mobileTheme.typography.subtitle,
    fontWeight: '600',
    color: mobileTheme.colors.primary,
  },
  sectionLine: {
    fontSize: mobileTheme.typography.body,
    color: mobileTheme.colors.foreground,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
