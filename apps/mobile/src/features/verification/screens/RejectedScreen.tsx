import { useRouter, useLocalSearchParams } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { Button } from '@/components/ui/Button';
import { mobileTheme, withAlpha } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

export default function RejectedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  return (
    <ScreenContainer testID="SCR-TASK-009">
      <View
        className="w-18 h-18 rounded-full justify-center items-center mb-xl"
        style={{ backgroundColor: withAlpha(colors.danger, 0.1) }}
      >
        <AlertTriangle size={24} color={colors.danger} />
      </View>
      <Text className="text-title font-sans-bold text-danger text-center">
        {t('tasker.verification.rejectedTitle')}
      </Text>
      <Text className="text-body text-text-secondary text-center mt-sm leading-relaxed">
        {t('tasker.verification.rejectedBody')}
      </Text>

      {reason ? (
        <Text className="text-body text-foreground text-center mt-lg leading-relaxed">
          {reason}
        </Text>
      ) : null}

      <View className="self-stretch mt-lg gap-sm p-lg rounded-md bg-muted">
        <Text className="text-body text-foreground leading-relaxed">
          {t('tasker.verification.rejectedTipLighting')}
        </Text>
        <Text className="text-body text-foreground leading-relaxed">
          {t('tasker.verification.rejectedTipFlat')}
        </Text>
        <Text className="text-body text-foreground leading-relaxed">
          {t('tasker.verification.rejectedTipFace')}
        </Text>
      </View>

      <Button
        label={t('tasker.verification.rejectedResubmit')}
        onPress={() => router.push('/(tasker)/verification/upload')}
        className="self-stretch mt-xl"
        testID="rejected-screen-resubmit"
      />

      <Button
        label={t('tasker.verification.rejectedBrowse')}
        variant="ghost"
        onPress={() => router.push('/(tabs)')}
        className="self-stretch mt-md"
        testID="rejected-screen-browse"
      />
    </ScreenContainer>
  );
}
