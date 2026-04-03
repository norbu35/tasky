import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { spacing, typography, colors, radius } = mobileTheme;

export default function RejectedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  return (
    <View style={styles.container} testID="rejected-screen">
      <View style={styles.iconContainer}>
        <AlertTriangle size={48} color={colors.danger} />
      </View>
      <Text style={styles.title}>{t('tasker.verification.rejectedTitle')}</Text>
      <Text style={styles.description}>{t('tasker.verification.rejectedBody')}</Text>

      {reason ? <Text style={styles.reasonText}>{reason}</Text> : null}

      <View style={styles.tips}>
        <Text style={styles.tipText}>{t('tasker.verification.rejectedTipLighting')}</Text>
        <Text style={styles.tipText}>{t('tasker.verification.rejectedTipFlat')}</Text>
        <Text style={styles.tipText}>{t('tasker.verification.rejectedTipFace')}</Text>
      </View>

      <Button
        label={t('tasker.verification.rejectedResubmit')}
        onPress={() => router.push('/(tasker)/verification/upload')}
        style={styles.primaryCta}
        testID="rejected-screen-resubmit"
      />

      <Button
        label={t('tasker.verification.rejectedBrowse')}
        variant="ghost"
        onPress={() => router.push('/(tabs)')}
        style={styles.secondaryCta}
        testID="rejected-screen-browse"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.danger}1A`,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.danger,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.body * 1.6,
  },
  reasonText: {
    fontSize: typography.body,
    color: colors.foreground,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: typography.body * 1.6,
  },
  tips: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  tipText: {
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: typography.body * 1.5,
  },
  primaryCta: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  secondaryCta: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
