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
            {t('tasker.verification.danSuccess')}
          </Text>
          <Text className="text-body text-textSecondary text-center leading-relaxed">
            {t('DanVerificationScreen.copy1')}
          </Text>
          <Button
            label={t('tasker.verification.danBrowseButton')}
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
          {t('tasker.verification.danTitle')}
        </Text>
        <Text className="text-body text-textSecondary text-center leading-relaxed">
          {t('DanVerificationScreen.copy2')}
        </Text>
        <Button
          label={t('tasker.verification.danEmongoliaButton')}
          onPress={() => router.push('/(tasker)/verification/dan?state=success')}
        />
        <Button
          testID="dan-manual-fallback"
          label={t('tasker.verification.danManualButton')}
          variant="ghost"
          onPress={() => router.push('/(tasker)/verification/upload')}
        />
      </View>
    </AuthTemplate>
  );
}
