import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { mobileTheme } from '@/design/tokenAdapter';
import { useAuthStore } from '@/store/authStore';

const { colors } = mobileTheme;

export default function SessionExpiredScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const handleLogin = useCallback(() => {
    setSession(null);
    router.replace('/(auth)');
  }, [router, setSession]);

  return (
    <View
      className="flex-1 bg-background"
      style={{ position: 'relative', zIndex: 30 }}
      testID="SCR-INFRA-003"
    >
      <ModalSheetTemplate
        isOpen
        title={t('infra.sessionExpired.title')}
        onClose={() => {}}
        dismissible={false}
        primaryAction={{
          label: t('infra.sessionExpired.loginButton'),
          onPress: handleLogin,
          testID: 'session-expired-screen-login',
        }}
      >
        <View className="items-center pt-sm">
          <View className="h-20 w-20 rounded-full items-center justify-center bg-muted mb-lg">
            <LogIn size={24} color={colors.primary} />
          </View>
          <Text className="text-body text-text-secondary text-center leading-6">
            {t('SessionExpiredScreen.copy1')}
          </Text>
        </View>
      </ModalSheetTemplate>
    </View>
  );
}
