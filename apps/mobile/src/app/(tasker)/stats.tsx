import React from 'react';
import { StyleSheet, View } from 'react-native';
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

  return (
    <DetailTemplate
      headerTitle={t('tasker.stats.title', 'My Stats')}
      onBack={() => router.back()}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      testID="tasker-stats"
    >
      {data && (
        <View style={styles.content}>
          <View style={styles.statsRow}>
            <StatCard
              value={String(data.jobs_completed)}
              label={t('tasker.stats.jobsCompleted', 'Completed Jobs')}
            />
            <StatCard
              value={String(data.average_rating)}
              label={t('tasker.stats.averageRating', 'Overall Rating')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              value={String(data.response_time_minutes)}
              label={t('tasker.stats.responseTime', 'Response Time')}
            />
            <StatCard
              value={`${data.reliability_score}%`}
              label={t('tasker.stats.reliabilityScore', 'Reliability Score')}
            />
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
