import { useRouter } from 'expo-router';
import { Clock, CircleCheck, CircleDashed } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function PendingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View testID="SCR-TASK-007" className="flex-1 justify-center items-center px-lg">
      <View className="w-24 h-24 rounded-full bg-muted justify-center items-center mb-xl">
        <Clock size={40} color={colors.accent} />
      </View>
      <Text className="text-title font-bold text-foreground text-center">
        {t('tasker.verification.pendingTitle')}
      </Text>
      <Text className="text-body text-text-secondary text-center mt-sm leading-relaxed">
        {t('tasker.verification.pendingBody')}
      </Text>
      <Text className="text-body text-accent text-center mt-md font-medium">
        {t('tasker.verification.pendingSla')}
      </Text>

      <View
        className="self-stretch gap-sm mt-xl p-lg rounded-md bg-muted"
        style={elevations.soft}
        testID="pending-progress"
      >
        <View className="flex-row items-center gap-sm">
          <CircleCheck size={18} color={colors.verified} />
          <Text className="text-body text-primary leading-relaxed">
            {t('tasker.verification.pendingSubmitted')}
          </Text>
        </View>
        <View className="flex-row items-center gap-sm">
          <CircleDashed size={18} color={colors.accent} />
          <Text className="text-body text-primary leading-relaxed">
            {t('tasker.verification.pendingReviewing')}
          </Text>
        </View>
      </View>

      <Button
        label={t('tasker.verification.submittedCta')}
        onPress={() => router.replace('/(tabs)')}
        style={{ marginTop: mobileTheme.spacing.xl, alignSelf: 'stretch' }}
        testID="pending-screen-cta"
      />
      <Button
        label={t('tasker.verification.backButton')}
        variant="outline"
        onPress={() => router.back()}
        style={{ marginTop: mobileTheme.spacing.sm }}
        testID="verification-pending-screen-back"
      />
    </View>
  );
}
