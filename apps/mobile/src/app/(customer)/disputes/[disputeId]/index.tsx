import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { useDisputeDetail } from '../../../../features/disputes/hooks/useDisputeDetail';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type DisputeStatus =
  | 'OPEN'
  | 'ESCALATED'
  | 'RESOLVED_CUSTOMER'
  | 'RESOLVED_TASKER'
  | 'CLOSED_INSUFFICIENT';

const STATUS_CONFIG: Record<DisputeStatus, { label: string; description: string; color: string }> =
  {
    OPEN: {
      label: 'Open',
      description:
        'Your dispute is under admin review. You will be notified when a decision is made.',
      color: colors.statusOpen,
    },
    ESCALATED: {
      label: 'Escalated',
      description: 'Dispute has been escalated for further investigation. A response will follow.',
      color: colors.accent,
    },
    RESOLVED_CUSTOMER: {
      label: 'Resolved for Customer',
      description:
        'Dispute resolved in your favor. A misconduct note has been added to the other party.',
      color: colors.trust,
    },
    RESOLVED_TASKER: {
      label: 'Resolved for Tasker',
      description: 'Dispute resolved in favor of the Tasker.',
      color: colors.textSecondary,
    },
    CLOSED_INSUFFICIENT: {
      label: 'Closed — Insufficient Evidence',
      description: 'Dispute closed because evidence was not provided within 24 hours.',
      color: colors.danger,
    },
  };

export default function DisputeStatusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { disputeId } = useLocalSearchParams<{ disputeId: string }>();
  const { data: dispute, isLoading, isError, refetch } = useDisputeDetail(disputeId);

  const status = (dispute?.status as DisputeStatus) ?? 'OPEN';
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN;

  return (
    <DetailTemplate
      headerTitle={t('customer.disputes.statusTitle', 'Dispute Status')}
      onBack={() => router.back()}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      errorMessage={t('customer.disputes.errorToast', 'Failed to load dispute details')}
      testID="dispute-status-screen"
    >
      {dispute && (
        <>
          {/* Status Badge */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('customer.disputes.sectionStatus', 'Status')}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
              <Text style={styles.statusBadgeText}>{config.label}</Text>
            </View>
            <Text style={styles.statusDescription}>{config.description}</Text>
          </View>

          {/* Dispute Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('customer.disputes.sectionSummary', 'Dispute Summary')}
            </Text>
            <Text style={styles.reasonText}>{dispute.reason}</Text>
          </View>

          {/* Mediation Note */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              {t(
                'customer.disputes.mediationNote',
                'Disputes are evidence-only mediation. No monetary compensation is issued.',
              )}
            </Text>
          </View>
        </>
      )}
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  statusDescription: {
    fontSize: typography.body,
    color: colors.accent,
    lineHeight: typography.body * 1.6,
  },
  reasonText: {
    fontSize: typography.body,
    color: colors.primaryDeep,
  },
  noteContainer: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noteText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
});
