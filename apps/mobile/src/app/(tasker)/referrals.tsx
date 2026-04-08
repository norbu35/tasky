import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { InfoRow } from '../../components/ui/InfoRow';
import { Button } from '../../components/ui/Button';

export default function TaskerReferralsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <DetailTemplate testID="SCR-P2-005">
      <View className="gap-lg">
        <View className="p-lg rounded-lg bg-primaryDeep gap-md">
          <Text className="font-extrabold text-card" style={{ fontSize: 28, lineHeight: 28 * (17 / 14) }}>
            {t('tasker.referrals.heroTitle')}
          </Text>
          <Text className="text-body text-primaryForeground leading-relaxed" style={{ opacity: 0.85 }}>
            {t('TaskerReferralsScreen.copy1')}</Text>
          <View className="p-md rounded-md gap-xs" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
            <Text className="text-caption text-primaryForeground uppercase" style={{ letterSpacing: 0.4 }}>
              {t('tasker.referrals.codeLabel')}
            </Text>
            <Text className="text-subtitle font-extrabold text-card">TASKY-247</Text>
          </View>
          <View className="flex-row gap-sm">
            <Button
              label={t('tasker.referrals.copyCode')}
              onPress={() => {}}
              testID="tasker-referrals-copy-code"
              style={{ flex: 1 }}
            />
            <Button
              label={t('tasker.referrals.viewCredits')}
              variant="outline"
              onPress={() => router.push('/(tasker)/credits')}
              testID="tasker-referrals-view-credits"
              style={{ flex: 1 }}
            />
          </View>
        </View>

        <View className="gap-md">
          <Text className="text-heading font-bold text-primaryDeep">
            {t('tasker.referrals.howItWorks')}
          </Text>
          <View className="p-lg rounded-lg bg-card">
            <InfoRow
              label={t('tasker.referrals.step1Label')}
              value={t('tasker.referrals.step1Value')}
            />
            <InfoRow
              label={t('tasker.referrals.step2Label')}
              value={t('tasker.referrals.step2Value')}
            />
            <InfoRow
              label={t('tasker.referrals.step3Label')}
              value={t('tasker.referrals.step3Value')}
            />
          </View>
        </View>

        <Pressable className="p-lg rounded-lg gap-xs" style={{ backgroundColor: 'rgba(255, 221, 184, 0.22)' }}>
          <Text className="text-body font-bold text-foreground">
            {t('tasker.referrals.bonusPending')}
          </Text>
          <Text className="text-label text-textSecondary">{t('TaskerReferralsScreen.copy2')}</Text>
        </Pressable>
      </View>
    </DetailTemplate>
  );
}
