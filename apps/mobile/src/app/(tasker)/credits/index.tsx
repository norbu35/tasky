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
            {t('tasker.credits.availableBalance', 'Available balance')}
          </Text>
          <Text className="font-extrabold text-card" style={{ fontSize: 36, lineHeight: 36 * (7 / 6) }}>
            {balanceText}
          </Text>
          <Text className="text-body text-primaryForeground opacity-70">
            {t('tasker.credits.enoughForTwoTasks', 'Enough for 2 more average tasks')}
          </Text>
        </View>

        <LowBalanceAlert
          testID="credits-low-balance-alert"
          balanceText={balanceText}
          description={t('tasker.credits.lowBalanceDescription', 'Task applications are moving fast. Add credits before your balance drops to zero.')}
          primaryActionLabel="Top up now"
          onPrimaryActionPress={() => router.push('/(tasker)/credits/pay')}
          secondaryActionLabel="View history"
          onSecondaryActionPress={() => router.push('/(tasker)/credits/history')}
          primaryActionTestID="tasker-credits-topup"
          secondaryActionTestID="tasker-credits-history"
        />

        <View className="gap-md">
          <Text className="text-heading font-bold text-primaryDeep">
            {t('tasker.credits.quickActions', 'Quick actions')}
          </Text>
          <View className="flex-row gap-sm">
            <Button
              label={t('tasker.credits.topUp', 'Top up')}
              onPress={() => router.push('/(tasker)/credits/pay')}
              testID="tasker-credits-topup-secondary"
              style={{ flex: 1 }}
            />
            <Button
              label={t('tasker.credits.history', 'History')}
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
            <Text className="text-label font-bold text-primary">
              {t('tasker.referrals.title', 'Referrals')}
            </Text>
            <Text className="text-body text-textSecondary">
              {t('tasker.referrals.inviteBody', 'Invite taskers to earn bonus credits.')}
            </Text>
          </Pressable>
        </View>

        <View className="gap-md">
          <Text className="text-heading font-bold text-primaryDeep">
            {t('tasker.credits.currentSnapshot', 'Current snapshot')}
          </Text>
          <View className="p-lg rounded-lg bg-card">
            <InfoRow
              label={t('tasker.credits.reserved', 'Reserved for active bookings')}
              value="4,800 ₮"
            />
            <InfoRow
              label={t('tasker.credits.lastTopUp', 'Last top-up')}
              value={t('tasker.credits.yesterday', 'Yesterday')}
            />
            <InfoRow
              label={t('tasker.credits.pendingRewards', 'Pending rewards')}
              value="1,200 ₮"
            />
          </View>
        </View>
      </View>
    </DetailTemplate>
  );
}
