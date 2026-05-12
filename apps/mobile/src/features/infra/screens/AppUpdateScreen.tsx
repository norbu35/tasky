import { openURL } from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Download } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

const APP_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/tasky',
  android: 'https://play.google.com/store/apps/details?id=com.tasky',
  default: 'https://tasky.mn',
});

export default function AppUpdateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const isForce = params.type === 'force';

  const handleUpdate = useCallback(() => {
    void openURL(APP_STORE_URL);
  }, []);
  const handleDismiss = useCallback(() => router.back(), [router]);

  return (
    <ScreenContainer testID="SCR-INFRA-002">
      <View className="flex-1 justify-center items-center px-xl">
        <View className="h-20 w-20 rounded-full bg-muted items-center justify-center mb-lg">
          <Download size={24} color={colors.primary} />
        </View>
        <Text className="text-title font-sans-bold text-foreground text-center">
          {isForce ? t('infra.appUpdate.forceTitle') : t('infra.appUpdate.softTitle')}
        </Text>
        <Text className="text-body text-text-secondary text-center mt-sm leading-6">
          {isForce ? t('AppUpdateScreen.copy1') : t('AppUpdateScreen.copy2')}
        </Text>
        <Button
          label={t('infra.appUpdate.softUpdate')}
          onPress={handleUpdate}
          className="self-stretch mt-xl"
          testID="app-update-screen-update"
        />
        {!isForce && (
          <Button
            label={t('infra.appUpdate.softDismiss')}
            variant="ghost"
            onPress={handleDismiss}
            className="self-stretch mt-md"
            testID="app-update-screen-dismiss"
          />
        )}
      </View>
    </ScreenContainer>
  );
}
