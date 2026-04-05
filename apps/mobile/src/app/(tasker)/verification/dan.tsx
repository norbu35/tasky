import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthTemplate } from '../../../components/templates/AuthTemplate';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type DanState = 'default' | 'success';

export default function DanVerificationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ state?: DanState }>();
  const state = params.state === 'success' ? 'success' : 'default';

  if (state === 'success') {
    return (
      <AuthTemplate testID="SCR-TASK-006">
        <View style={styles.content}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>DAN</Text>
          </View>
          <Text style={styles.title}>
            {t('tasker.verification.danSuccess', 'Verification successful!')}
          </Text>
          <Text style={styles.description}>
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
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>E-Mongolia</Text>
        </View>
        <Text style={styles.title}>
          {t('tasker.verification.danTitle', 'Fast-track verification')}
        </Text>
        <Text style={styles.description}>
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

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  logoBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
  },
  logoBadgeText: {
    color: colors.primaryDeep,
    fontSize: typography.label,
    fontWeight: '700',
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
    textAlign: 'center',
  },
});
