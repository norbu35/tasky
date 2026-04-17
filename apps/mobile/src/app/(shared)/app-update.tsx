import { openURL } from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Download } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';

import { ScreenContainer } from '../../components/shells/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { mobileSurfaces, mobileTheme } from '../../design/tokenAdapter';

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
    <ScreenContainer testID="SCR-INFRA-002">
      <View className="flex-1 justify-center items-center px-xl">
        <View
          className="rounded-full bg-muted items-center justify-center mb-lg"
          style={{
            width: mobileSurfaces.statusHero.iconBox,
            height: mobileSurfaces.statusHero.iconBox,
          }}
        >
          <Download size={32} color={colors.primary} />
        </View>
        <Text className="text-title font-bold text-foreground text-center">{title}</Text>
        <Text className="text-body text-text-secondary text-center mt-sm leading-6">{body}</Text>
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
