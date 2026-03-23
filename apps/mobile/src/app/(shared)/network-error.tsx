import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../../components/ui/Button';

const { colors, spacing, typography } = mobileTheme;

type ConnectionType = 'no_connection' | 'slow_connection';

export default function NetworkErrorScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ type?: string }>();
  const connectionType: ConnectionType =
    params.type === 'slow_connection' ? 'slow_connection' : 'no_connection';

  const [isRetrying, setIsRetrying] = useState(false);

  const headline =
    connectionType === 'slow_connection'
      ? t('infra.networkError.slowConnection', 'Connection is slow')
      : t('infra.networkError.noConnection', 'No internet connection');

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    // Simulate retry attempt
    setTimeout(() => {
      setIsRetrying(false);
    }, 1500);
  }, []);

  return (
    <View style={styles.container} testID="network-error-screen">
      <WifiOff size={48} color={colors.danger} />
      <Text style={styles.headline}>{headline}</Text>
      <Button
        label={t('infra.networkError.retry', 'Try Again')}
        onPress={handleRetry}
        isLoading={isRetrying}
        style={styles.retryButton}
        testID="network-error-screen-retry"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  headline: {
    fontSize: typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: typography.body * 1.6,
  },
  retryButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
