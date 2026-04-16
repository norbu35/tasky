import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { Button } from '../../components/ui/Button';
import { InfoRow } from '../../components/ui/InfoRow';
import { mobileSurfaces } from '../../design/tokenAdapter';

const { referrals } = mobileSurfaces;

export default function TaskerReferralsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <DetailTemplate testID="SCR-P2-005">
      <View className="gap-lg">
        <View className="p-lg rounded-lg bg-primary-deep gap-md">
          <Text
            className="font-extrabold text-card"
            style={{ fontSize: referrals.heroSize, lineHeight: referrals.heroLineHeight }}
          >
            {t('tasker.referrals.heroTitle')}
          </Text>
          <Text
            className="text-body text-primary-foreground leading-relaxed"
            style={{ opacity: referrals.bodyOpacity }}
          >
            {t('TaskerReferralsScreen.copy1')}
          </Text>
          <View
            className="p-md rounded-md gap-xs"
            style={{ backgroundColor: referrals.codeSurface }}
          >
            <Text
              className="text-caption text-primary-foreground uppercase"
              style={{ letterSpacing: referrals.codeTracking }}
            >
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
          <Text className="text-heading font-bold text-primary-deep">
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

        <Pressable
          className="p-lg rounded-lg gap-xs"
          style={{ backgroundColor: referrals.bonusSurface }}
        >
          <Text className="text-body font-bold text-foreground">
            {t('tasker.referrals.bonusPending')}
          </Text>
          <Text className="text-label text-text-secondary">{t('TaskerReferralsScreen.copy2')}</Text>
        </Pressable>
      </View>
    </DetailTemplate>
  );
}
