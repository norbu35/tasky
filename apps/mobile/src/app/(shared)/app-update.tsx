import React, { useCallback } from 'react';
import { Platform, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { openURL } from 'expo-linking';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../../components/ui/Button';

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

  const title = isForce ? t('infra.appUpdate.forceTitle') : t('infra.appUpdate.softTitle');

  const body = isForce ? t('AppUpdateScreen.copy1') : t('AppUpdateScreen.copy2');

  const handleUpdate = useCallback(() => {
    void openURL(APP_STORE_URL);
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View className="flex-1 justify-center items-center px-xl bg-background" testID="SCR-INFRA-002">
      <View className="w-[72px] h-[72px] rounded-full bg-muted items-center justify-center mb-lg">
        <Download size={32} color={colors.primary} />
      </View>
      <Text className="text-title font-bold text-foreground text-center">{title}</Text>
      <Text className="text-body text-textSecondary text-center mt-sm leading-6">{body}</Text>
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
  );
}
