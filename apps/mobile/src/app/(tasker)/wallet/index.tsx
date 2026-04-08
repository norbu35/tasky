import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';

export default function WalletScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScrollView
      testID="SCR-P3-001"
      className="flex-1 bg-background"
      contentContainerClassName="p-xl gap-lg"
    >
      <Text className="text-heading font-bold text-primaryDeep">
        {t('tasker.wallet.title', 'Wallet')}
      </Text>
      <View className="bg-primaryDeep rounded-lg p-xl gap-sm">
        <Text className="text-label text-primaryForeground opacity-80">
          {t('tasker.wallet.availableBalance', 'Available Balance')}
        </Text>
        <Text className="text-card font-extrabold" style={{ fontSize: 32 }}>
          ₮120,000
        </Text>
      </View>
      <View className="flex-row gap-md">
        <View className="flex-1 bg-muted rounded-md p-lg">
          <Text className="text-caption text-textSecondary mb-xs">
            {t('tasker.wallet.totalEarnings', 'Total Earnings')}
          </Text>
          <Text className="text-body font-bold text-primaryDeep">₮450,000</Text>
        </View>
        <View className="flex-1 bg-muted rounded-md p-lg">
          <Text className="text-caption text-textSecondary mb-xs">
            {t('tasker.wallet.pending', 'Pending')}
          </Text>
          <Text className="text-body font-bold text-primaryDeep">₮80,000</Text>
        </View>
      </View>
      <Button
        label={t('tasker.wallet.payoutTitle', 'Request Payout')}
        onPress={() => router.push('/(tasker)/wallet/payout')}
      />
    </ScrollView>
  );
}
