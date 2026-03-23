import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ErrorStateTemplate } from '../../../components/templates/ErrorStateTemplate';
import { mobileTheme } from '../../../design/tokenAdapter';

const { spacing, typography, colors } = mobileTheme;

export default function RejectedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  return (
    <View style={styles.container}>
      <ErrorStateTemplate
        message={t('tasker.verification.rejectedBody')}
        onRetry={() => router.push('/(tasker)/verification/upload')}
        retryLabel={t('tasker.verification.rejectedResubmit')}
        testID="rejected-screen"
      />
      <View style={styles.reasonContainer}>
        <Text style={styles.reasonHeading}>{t('tasker.verification.rejectedTitle')}</Text>
        {reason ? <Text style={styles.reasonText}>{reason}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reasonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  reasonHeading: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontSize: typography.body,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
});
