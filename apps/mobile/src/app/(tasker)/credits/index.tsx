import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { InfoRow } from '../../../components/ui/InfoRow';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';
import { LowBalanceAlert } from '../../../features/credits/components/LowBalanceAlert';

const { colors, spacing, typography, radius } = mobileTheme;

const balanceText = '12,400 ₮';

export default function TaskerCreditsIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <DetailTemplate testID="SCR-P2-001">
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            {t('tasker.credits.availableBalance', 'Available balance')}
          </Text>
          <Text style={styles.heroValue}>{balanceText}</Text>
          <Text style={styles.heroCaption}>
            {t('tasker.credits.enoughForTwoTasks', 'Enough for 2 more average tasks')}
          </Text>
        </View>

        <LowBalanceAlert
          testID="credits-low-balance-alert"
          balanceText={balanceText}
          description="Task applications are moving fast. Add credits before your balance drops to zero."
          primaryActionLabel="Top up now"
          onPrimaryActionPress={() => router.push('/(tasker)/credits/pay')}
          secondaryActionLabel="View history"
          onSecondaryActionPress={() => router.push('/(tasker)/credits/history')}
          primaryActionTestID="tasker-credits-topup"
          secondaryActionTestID="tasker-credits-history"
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('tasker.credits.quickActions', 'Quick actions')}
          </Text>
          <View style={styles.actionRow}>
            <Button
              label={t('tasker.credits.topUp', 'Top up')}
              onPress={() => router.push('/(tasker)/credits/pay')}
              testID="tasker-credits-topup-secondary"
              style={styles.actionButton}
            />
            <Button
              label={t('tasker.credits.history', 'History')}
              variant="outline"
              onPress={() => router.push('/(tasker)/credits/history')}
              testID="tasker-credits-history-secondary"
              style={styles.actionButton}
            />
          </View>
          <Pressable
            style={styles.referralLink}
            onPress={() => router.push('/(tasker)/referrals')}
            testID="tasker-credits-referrals"
          >
            <Text style={styles.referralTitle}>{t('tasker.referrals.title', 'Referrals')}</Text>
            <Text style={styles.referralBody}>
              {t('tasker.referrals.inviteBody', 'Invite taskers to earn bonus credits.')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('tasker.credits.currentSnapshot', 'Current snapshot')}
          </Text>
          <View style={styles.infoCard}>
            <InfoRow
              label={t('tasker.credits.reserved', 'Reserved for active bookings')}
              value="4,800 ₮"
            />
            <InfoRow
              label={t('tasker.credits.lastTopUp', 'Last top-up')}
              value={t('tasker.credits.yesterday', 'Yesterday')}
            />
            <InfoRow
              label={t('tasker.credits.pendingRewards', 'Pending rewards')}
              value="1,200 ₮"
            />
          </View>
        </View>
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
    backgroundColor: colors.primaryDeep,
    gap: spacing.xs,
  },
  heroLabel: {
    fontSize: typography.label,
    color: colors.primaryForeground,
    opacity: 0.8,
  },
  heroValue: {
    fontSize: 36,
    lineHeight: 36 * (7 / 6),
    fontWeight: '800',
    color: colors.card,
  },
  heroCaption: {
    fontSize: typography.body,
    color: colors.primaryForeground,
    opacity: 0.7,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  referralLink: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    gap: spacing.xs,
  },
  referralTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primary,
  },
  referralBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
});
