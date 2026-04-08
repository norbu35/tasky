import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { InfoRow } from '../../../components/ui/InfoRow';
import { Button } from '../../../components/ui/Button';
import { LowBalanceAlert } from '../../../features/credits/components/LowBalanceAlert';

const balanceText = '12,400 ₮';

export default function TaskerCreditsIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <DetailTemplate testID="SCR-P2-001">
      <View className="gap-lg">
        <View className="p-lg rounded-lg bg-primaryDeep gap-xs">
          <Text className="text-label text-primaryForeground opacity-80">
            {t('tasker.credits.availableBalance')}
          </Text>
          <Text
            className="font-extrabold text-card"
            style={{ fontSize: 36, lineHeight: 36 * (7 / 6) }}
          >
            {balanceText}
          </Text>
          <Text className="text-body text-primaryForeground opacity-70">
            {t('tasker.credits.enoughForTwoTasks')}
          </Text>
        </View>

        <LowBalanceAlert
          testID="credits-low-balance-alert"
          balanceText={balanceText}
          description={t('tasker.credits.lowBalanceDescription')}
          primaryActionLabel={t('TaskerCreditsIndexScreen.copy1')}
          onPrimaryActionPress={() => router.push('/(tasker)/credits/pay')}
          secondaryActionLabel={t('TaskerCreditsIndexScreen.copy2')}
          onSecondaryActionPress={() => router.push('/(tasker)/credits/history')}
          primaryActionTestID="tasker-credits-topup"
          secondaryActionTestID="tasker-credits-history"
        />

        <View className="gap-md">
          <Text className="text-heading font-bold text-primaryDeep">
            {t('tasker.credits.quickActions')}
          </Text>
          <View className="flex-row gap-sm">
            <Button
              label={t('tasker.credits.topUp')}
              onPress={() => router.push('/(tasker)/credits/pay')}
              testID="tasker-credits-topup-secondary"
              style={{ flex: 1 }}
            />
            <Button
              label={t('tasker.credits.history')}
              variant="outline"
              onPress={() => router.push('/(tasker)/credits/history')}
              testID="tasker-credits-history-secondary"
              style={{ flex: 1 }}
            />
          </View>
          <Pressable
            className="p-lg rounded-lg bg-muted gap-xs"
            onPress={() => router.push('/(tasker)/referrals')}
            testID="tasker-credits-referrals"
          >
            <Text className="text-label font-bold text-primary">{t('tasker.referrals.title')}</Text>
            <Text className="text-body text-textSecondary">{t('tasker.referrals.inviteBody')}</Text>
          </Pressable>
        </View>

        <View className="gap-md">
          <Text className="text-heading font-bold text-primaryDeep">
            {t('tasker.credits.currentSnapshot')}
          </Text>
          <View className="p-lg rounded-lg bg-card">
            <InfoRow label={t('tasker.credits.reserved')} value="4,800 ₮" />
            <InfoRow label={t('tasker.credits.lastTopUp')} value={t('tasker.credits.yesterday')} />
            <InfoRow label={t('tasker.credits.pendingRewards')} value="1,200 ₮" />
          </View>
        </View>
      </View>
    </DetailTemplate>
  );
}
