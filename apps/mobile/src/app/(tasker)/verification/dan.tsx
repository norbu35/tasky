import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthTemplate } from '../../../components/templates/AuthTemplate';
import { Button } from '../../../components/ui/Button';

type DanState = 'default' | 'success';

export default function DanVerificationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ state?: DanState }>();
  const state = params.state === 'success' ? 'success' : 'default';

  if (state === 'success') {
    return (
      <AuthTemplate testID="SCR-TASK-006">
        <View className="gap-lg items-center pt-2xl">
          <View className="px-lg py-sm rounded-full bg-muted">
            <Text className="text-primaryDeep text-label font-bold">DAN</Text>
          </View>
          <Text className="text-heading font-extrabold text-primaryDeep text-center">
            {t('tasker.verification.danSuccess', 'Verification successful!')}
          </Text>
          <Text className="text-body text-textSecondary text-center leading-relaxed">
            {t(
              'tasker.verification.danSuccessDescription',
              'Your address has been verified via E-Mongolia. You can now apply for tasks.',
            )}
          </Text>
          <Button
            label={t('tasker.verification.danBrowseButton', 'Find tasks')}
            onPress={() => router.push('/(tabs)')}
          />
        </View>
      </AuthTemplate>
    );
  }

  return (
    <AuthTemplate testID="dan-verification-screen">
      <View className="gap-lg items-center pt-2xl">
        <View className="px-lg py-sm rounded-full bg-muted">
          <Text className="text-primaryDeep text-label font-bold">E-Mongolia</Text>
        </View>
        <Text className="text-heading font-extrabold text-primaryDeep text-center">
          {t('tasker.verification.danTitle', 'Fast-track verification')}
        </Text>
        <Text className="text-body text-textSecondary text-center leading-relaxed">
          {t(
            'tasker.verification.danDescription',
            'E-Mongolia (DAN) will automatically verify your identity. No photos required.',
          )}
        </Text>
        <Button
          label={t('tasker.verification.danEmongoliaButton', 'Verify with E-Mongolia')}
          onPress={() => router.push('/(tasker)/verification/dan?state=success')}
        />
        <Button
          testID="dan-manual-fallback"
          label={t('tasker.verification.danManualButton', 'Verify manually')}
          variant="ghost"
          onPress={() => router.push('/(tasker)/verification/upload')}
        />
      </View>
    </AuthTemplate>
  );
}
