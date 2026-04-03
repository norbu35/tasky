import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { EmptyStateTemplate } from '../../../components/templates/EmptyStateTemplate';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

type RouteState = 'loaded' | 'empty';

interface Transaction {
  id: string;
  title: string;
  amount: string;
  subtitle: string;
  timestamp: string;
}

function resolveState(value: string | string[] | undefined): RouteState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'empty' ? 'empty' : 'loaded';
}

export default function TaskerCreditsHistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const state = resolveState(params.state);

  const transactions: Transaction[] = [
    {
      id: 'top-up-1',
      title: 'Top-up',
      amount: '+20,000 ₮',
      subtitle: t('tasker.credits.mobileWallet', 'Mobile wallet'),
      timestamp: t('tasker.credits.today', 'Today'),
    },
    {
      id: 'payout-1',
      title: t('tasker.credits.taskPayout', 'Task payout'),
      amount: '-7,600 ₮',
      subtitle: t('tasker.credits.completedBooking', 'Completed booking'),
      timestamp: t('tasker.credits.yesterday', 'Yesterday'),
    },
  ];

  return (
    <DetailTemplate testID="tasker-credits-history">
      {state === 'empty' ? (
        <EmptyStateTemplate
          testID="tasker-credits-history-empty"
          title="No credit activity yet"
          description="Top up credits or finish more tasks to populate this timeline."
        />
      ) : (
        <View style={styles.stack}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('tasker.credits.thisMonth', 'This month')}</Text>
            <Text style={styles.summaryValue}>+12,400 ₮</Text>
            <Text style={styles.summaryCaption}>
              {t('tasker.credits.netMovement', 'Net credit movement from top-ups and payouts')}
            </Text>
          </View>

          <View style={styles.timeline}>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                </View>
                <Text style={styles.transactionSubtitle}>{transaction.subtitle}</Text>
                <Text style={styles.transactionTimestamp}>{transaction.timestamp}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDeep,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.label,
    color: colors.primaryForeground,
    opacity: 0.8,
  },
  summaryValue: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.card,
  },
  summaryCaption: {
    fontSize: typography.body,
    color: colors.primaryForeground,
    opacity: 0.7,
  },
  timeline: {
    gap: spacing.sm,
  },
  transactionCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    gap: spacing.xs,
    ...elevations.soft,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  transactionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.foreground,
    flex: 1,
  },
  transactionAmount: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  transactionSubtitle: {
    fontSize: typography.label,
    color: colors.textSecondary,
  },
  transactionTimestamp: {
    fontSize: typography.caption,
    color: colors.textTertiary,
  },
});
