import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';

const { colors, spacing, typography, radius } = mobileTheme;

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
      ? t('infra.networkError.slowConnection', 'Холболт удаан байна')
      : t('infra.networkError.noConnection', 'Интернэт холболтгүй байна');

  const description =
    connectionType === 'slow_connection'
      ? t('infra.networkError.slowDescription', 'Сүлжээний холболт удаан байна. Түр хүлээнэ үү')
      : t(
          'infra.networkError.noConnectionDescription',
          'Сүлжээний холболтоо шалгаад дахин оролдоно уу',
        );

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
    <View style={styles.container} testID="network-error-screen">
      <View style={styles.iconShell}>
        <WifiOff size={40} color={colors.danger} />
      </View>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.description}>{description}</Text>
      <Button
        label={t('infra.networkError.retry', 'Дахин оролдох')}
        onPress={handleRetry}
        isLoading={isRetrying}
        style={styles.retryButton}
        testID="network-error-screen-retry"
      />
      {isRestored ? (
        <View style={styles.toastWrap}>
          <Toast message={t('infra.networkError.restored', 'Холболт сэргэлээ')} variant="success" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  iconShell: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.danger}1A`,
    marginBottom: spacing.lg,
  },
  headline: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  retryButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  toastWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing['2xl'],
  },
});
