import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { InfoRow } from '../../components/ui/InfoRow';
import { Button } from '../../components/ui/Button';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

export default function TaskerReferralsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <DetailTemplate headerTitle="Referrals" onBack={() => router.back()} testID="tasker-referrals-screen">
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t('tasker.referrals.heroTitle', 'Invite a tasker')}</Text>
          <Text style={styles.heroBody}>
            Share your invite code to grow the network and unlock simple bonus credits.
          </Text>
          <View style={styles.codePill}>
            <Text style={styles.codeLabel}>{t('tasker.referrals.codeLabel', 'Invite code')}</Text>
            <Text style={styles.codeValue}>TASKY-247</Text>
          </View>
          <View style={styles.actionRow}>
            <Button
              label={t('tasker.referrals.copyCode', 'Copy invite code')}
              onPress={() => {}}
              testID="tasker-referrals-copy-code"
              style={styles.actionButton}
            />
            <Button
              label={t('tasker.referrals.viewCredits', 'View credits')}
              variant="outline"
              onPress={() => router.push('/(tasker)/credits')}
              testID="tasker-referrals-view-credits"
              style={styles.actionButton}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('tasker.referrals.howItWorks', 'How it works')}</Text>
          <View style={styles.infoCard}>
            <InfoRow label={t('tasker.referrals.step1Label', 'Step 1')} value={t('tasker.referrals.step1Value', 'Share your code with another tasker')} />
            <InfoRow label={t('tasker.referrals.step2Label', 'Step 2')} value={t('tasker.referrals.step2Value', 'They complete verification')} />
            <InfoRow label={t('tasker.referrals.step3Label', 'Step 3')} value={t('tasker.referrals.step3Value', 'You both receive a bonus')} />
          </View>
        </View>

        <Pressable style={styles.banner}>
          <Text style={styles.bannerTitle}>{t('tasker.referrals.bonusPending', 'Referral bonus pending')}</Text>
          <Text style={styles.bannerBody}>1 invite is still in review.</Text>
        </Pressable>
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  heroCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.foreground,
  },
  heroBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  codePill: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16, 38, 56, 0.08)',
    gap: spacing.xs,
  },
  codeLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  codeValue: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  banner: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 221, 184, 0.22)',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  bannerTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.foreground,
  },
  bannerBody: {
    fontSize: typography.label,
    color: colors.textSecondary,
  },
});
