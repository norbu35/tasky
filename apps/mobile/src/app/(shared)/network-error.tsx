import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';

const { colors } = mobileTheme;

type ConnectionType = 'no_connection' | 'slow_connection';

export default function NetworkErrorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const connectionType: ConnectionType =
    params.type === 'slow_connection' ? 'slow_connection' : 'no_connection';

  const [isRetrying, setIsRetrying] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  const headline =
    connectionType === 'slow_connection'
      ? t('infra.networkError.slowConnection')
      : t('infra.networkError.noConnection');

  const description =
    connectionType === 'slow_connection'
      ? t('infra.networkError.slowDescription')
      : t('NetworkErrorScreen.copy1');

  const handleRetry = useCallback(() => {
    setIsRetrying(true);

    setTimeout(() => {
      setIsRetrying(false);
      setIsRestored(true);
      setTimeout(() => {
        router.back();
      }, 2500);
    }, 1500);
  }, [router]);

  return (
    <View className="flex-1 justify-center items-center px-xl bg-background" testID="SCR-INFRA-001">
      <View
        className="w-[72px] h-[72px] rounded-full items-center justify-center mb-lg"
        style={{ backgroundColor: `${colors.danger}1A` }}
      >
        <WifiOff size={40} color={colors.danger} />
      </View>
      <Text className="text-title font-bold text-foreground text-center">{headline}</Text>
      <Text className="text-body text-textSecondary text-center mt-sm leading-6">{description}</Text>
      <Button
        label={t('infra.networkError.retry')}
        onPress={handleRetry}
        isLoading={isRetrying}
        className="self-stretch mt-xl"
        testID="network-error-screen-retry"
      />
      {isRestored ? (
        <View className="absolute left-lg right-lg bottom-2xl">
          <Toast message={t('infra.networkError.restored')} variant="success" />
        </View>
      ) : null}
    </View>
  );
}
