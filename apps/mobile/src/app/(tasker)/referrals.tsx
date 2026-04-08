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
            {t('tasker.referrals.heroTitle', 'Invite a tasker')}
          </Text>
          <Text className="text-body text-primaryForeground leading-relaxed" style={{ opacity: 0.85 }}>
            Share your invite code to grow the network and unlock simple bonus credits.
          </Text>
          <View className="p-md rounded-md gap-xs" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
            <Text className="text-caption text-primaryForeground uppercase" style={{ letterSpacing: 0.4 }}>
              {t('tasker.referrals.codeLabel', 'Invite code')}
            </Text>
            <Text className="text-subtitle font-extrabold text-card">TASKY-247</Text>
          </View>
          <View className="flex-row gap-sm">
            <Button
              label={t('tasker.referrals.copyCode', 'Copy invite code')}
              onPress={() => {}}
              testID="tasker-referrals-copy-code"
              style={{ flex: 1 }}
            />
            <Button
              label={t('tasker.referrals.viewCredits', 'View credits')}
              variant="outline"
              onPress={() => router.push('/(tasker)/credits')}
              testID="tasker-referrals-view-credits"
              style={{ flex: 1 }}
            />
          </View>
        </View>

        <View className="gap-md">
          <Text className="text-heading font-bold text-primaryDeep">
            {t('tasker.referrals.howItWorks', 'How it works')}
          </Text>
          <View className="p-lg rounded-lg bg-card">
            <InfoRow
              label={t('tasker.referrals.step1Label', 'Step 1')}
              value={t('tasker.referrals.step1Value', 'Share your code with another tasker')}
            />
            <InfoRow
              label={t('tasker.referrals.step2Label', 'Step 2')}
              value={t('tasker.referrals.step2Value', 'They complete verification')}
            />
            <InfoRow
              label={t('tasker.referrals.step3Label', 'Step 3')}
              value={t('tasker.referrals.step3Value', 'You both receive a bonus')}
            />
          </View>
        </View>

        <Pressable className="p-lg rounded-lg gap-xs" style={{ backgroundColor: 'rgba(255, 221, 184, 0.22)' }}>
          <Text className="text-body font-bold text-foreground">
            {t('tasker.referrals.bonusPending', 'Referral bonus pending')}
          </Text>
          <Text className="text-label text-textSecondary">1 invite is still in review.</Text>
        </Pressable>
      </View>
    </DetailTemplate>
  );
}
