import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Clock, CircleCheck, CircleDashed } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function PendingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View testID="SCR-TASK-007" style={styles.container}>
      <View style={styles.iconContainer}>
        <Clock size={40} color={colors.accent} />
      </View>
      <Text style={styles.title}>{t('tasker.verification.pendingTitle')}</Text>
      <Text style={styles.description}>{t('tasker.verification.pendingBody')}</Text>
      <Text style={styles.sla}>{t('tasker.verification.pendingSla')}</Text>

      <View style={styles.progress} testID="pending-progress">
        <View style={styles.progressRow}>
          <CircleCheck size={18} color={colors.verified} />
          <Text style={styles.progressText}>{t('tasker.verification.pendingSubmitted')}</Text>
        </View>
        <View style={styles.progressRow}>
          <CircleDashed size={18} color={colors.accent} />
          <Text style={styles.progressText}>{t('tasker.verification.pendingReviewing')}</Text>
        </View>
      </View>

      <Button
        label={t('tasker.verification.submittedCta')}
        onPress={() => router.replace('/(tabs)')}
        style={styles.cta}
        testID="pending-screen-cta"
      />
      <Button
        label="Буцах"
        variant="outline"
        onPress={() => router.back()}
        style={styles.secondaryBtn}
        testID="verification-pending-screen-back"
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
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
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
    lineHeight: typography.body * 1.6,
  },
  sla: {
    fontSize: typography.body,
    color: colors.accent,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '500',
  },
  progress: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    ...elevations.soft,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressText: {
    fontSize: typography.body,
    color: colors.primary,
    lineHeight: typography.body * 1.5,
  },
  cta: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  secondaryBtn: {
    marginTop: spacing.sm,
  },
});
