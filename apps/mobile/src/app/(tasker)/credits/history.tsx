import { useTranslation } from 'react-i18next';
import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { EmptyStateTemplate } from '../../../components/templates/EmptyStateTemplate';
import { elevations } from '../../../design/tokenAdapter';

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
    <DetailTemplate testID="SCR-P2-003">
      {state === 'empty' ? (
        <EmptyStateTemplate
          testID="tasker-credits-history-empty"
          title={t('tasker.credits.emptyTitle', 'No credit activity yet')}
          description={t('tasker.credits.emptyDescription', 'Top up credits or finish more tasks to populate this timeline.')}
        />
      ) : (
        <View className="gap-lg">
          <View className="p-lg rounded-lg bg-primaryDeep gap-xs">
            <Text className="text-label text-primaryForeground opacity-80">
              {t('tasker.credits.thisMonth', 'This month')}
            </Text>
            <Text className="font-extrabold text-card" style={{ fontSize: 32, lineHeight: 32 * (19 / 16) }}>
              +12,400 ₮
            </Text>
            <Text className="text-body text-primaryForeground opacity-70">
              {t('tasker.credits.netMovement', 'Net credit movement from top-ups and payouts')}
            </Text>
          </View>

          <View className="gap-sm">
            {transactions.map((transaction) => (
              <View key={transaction.id} className="p-lg rounded-lg bg-card gap-xs" style={elevations.soft}>
                <View className="flex-row justify-between gap-md">
                  <Text className="text-body font-bold text-foreground flex-1">
                    {transaction.title}
                  </Text>
                  <Text className="text-body font-bold text-primary">
                    {transaction.amount}
                  </Text>
                </View>
                <Text className="text-label text-textSecondary">{transaction.subtitle}</Text>
                <Text className="text-caption text-textTertiary">{transaction.timestamp}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </DetailTemplate>
  );
}
