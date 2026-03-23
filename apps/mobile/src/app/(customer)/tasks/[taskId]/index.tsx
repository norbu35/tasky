import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Star } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { StatusBadge, ProfileAvatar } from '../../../../components/ui';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { useCustomerTaskDetail } from '../../../../features/tasks/hooks/useCustomerTaskDetail';
import { TaskCancelSheet } from '../../../../features/tasks/components/TaskCancelSheet';

const { colors, spacing, typography, radius } = mobileTheme;

export default function TaskDetailCustomerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { task, isLoading, isError, refetch } = useCustomerTaskDetail(taskId);
  const [showCancelSheet, setShowCancelSheet] = useState(false);

  const status = (task?.status ?? '') as string;
  const isOpen = status === 'OPEN';
  const isAssigned = status === 'ASSIGNED';
  const isTaskerMarkedDone = status === 'TASKER_MARKED_DONE';
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';
  const _isTerminal = isCompleted || isCancelled || status === 'NO_SHOW';

  const hasApplicants = (task as any)?.applicant_count > 0;
  const tasker = (task as any)?.tasker;

  // Determine primary CTA
  let ctaLabel: string | undefined;
  let ctaOnPress: (() => void) | undefined;

  if (isOpen && hasApplicants) {
    ctaLabel = t('customer.taskDetail.viewApplicants', 'View Applicants');
    ctaOnPress = () => router.push(`/(customer)/tasks/${taskId}/applicants`);
  } else if (isTaskerMarkedDone) {
    ctaLabel = t('customer.taskDetail.markComplete', 'Confirm Complete');
    ctaOnPress = () => {
      // Will be connected to complete booking mutation
    };
  } else if (isAssigned && tasker) {
    ctaLabel = t('customer.taskDetail.messageTasker', 'Message Tasker');
    ctaOnPress = () => {
      // Navigate to messaging
    };
  } else if (isOpen && !hasApplicants) {
    // When open with no applicants, use cancel as primary CTA
    ctaLabel = t('customer.taskDetail.cancel', 'Cancel Task');
    ctaOnPress = () => setShowCancelSheet(true);
  }

  // Secondary CTA for cancel (only when there is already a primary CTA)
  let secondaryCtaLabel: string | undefined;
  let secondaryCtaOnPress: (() => void) | undefined;

  if ((isOpen && hasApplicants) || isAssigned) {
    secondaryCtaLabel = t('customer.taskDetail.cancel', 'Cancel Task');
    secondaryCtaOnPress = () => setShowCancelSheet(true);
  }

  return (
    <>
      <DetailTemplate
        testID="task-detail-customer-screen"
        headerTitle={t('customer.taskDetail.title', 'Task Detail')}
        onBack={() => router.back()}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        errorMessage={t('customer.taskDetail.errorNetwork', 'Failed to load task detail')}
        ctaLabel={ctaLabel}
        ctaOnPress={ctaOnPress}
        secondaryCtaLabel={secondaryCtaLabel}
        secondaryCtaOnPress={secondaryCtaOnPress}
      >
        {task && (
          <View style={styles.content}>
            {/* Status Badge */}
            <StatusBadge
              status={(status === 'TASKER_MARKED_DONE' ? 'assigned' : status.toLowerCase()) as any}
            />

            {/* Task Description */}
            <Text style={styles.title}>{task.description}</Text>

            {/* Details Section */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t('customer.postTask.budgetLabel', 'Budget')}
                </Text>
                <Text style={styles.detailValue}>{(task.budget ?? 0).toLocaleString()}₮</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t('customer.postTask.location', 'Location')}
                </Text>
                <Text style={styles.detailValue}>{(task as any).location_text ?? ''}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t('customer.postTask.scheduleDate', 'Date')}
                </Text>
                <Text style={styles.detailValue}>
                  {task.scheduled_at ? task.scheduled_at.split('T')[0] : ''}
                </Text>
              </View>
            </View>

            {/* Applicants Section (OPEN state) */}
            {isOpen && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('customer.taskDetail.applicants', 'Applicants')}
                </Text>
                {hasApplicants ? (
                  <Text style={styles.applicantCount}>
                    {(task as any).applicant_count}{' '}
                    {t('customer.applicants.title', 'applications received')}
                  </Text>
                ) : (
                  <Text style={styles.noApplicants}>
                    {t('customer.taskDetail.noApplicants', 'No applicants yet')}
                  </Text>
                )}
              </View>
            )}

            {/* Assigned Tasker Info */}
            {(isAssigned || isTaskerMarkedDone) && tasker && (
              <View style={styles.taskerCard}>
                <View style={styles.taskerRow}>
                  <ProfileAvatar
                    uri={tasker.avatar_url}
                    name={tasker.full_name}
                    size="lg"
                    showVerified={tasker.is_pro}
                  />
                  <View style={styles.taskerInfo}>
                    <Text style={styles.taskerName}>{tasker.full_name}</Text>
                    <View style={styles.ratingRow}>
                      <Star size={14} color={colors.accent} fill={colors.accent} />
                      <Text style={styles.ratingText}>{tasker.rating_avg ?? 0}</Text>
                    </View>
                    {tasker.is_pro && (
                      <View style={styles.verifiedRow}>
                        <ShieldCheck size={14} color={colors.trustMuted} />
                        <Text style={styles.verifiedText}>
                          {t('customer.taskerProfile.verified', 'Identity Verified')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Payment note */}
            {(isOpen || isAssigned) && (
              <Text style={styles.paymentNote}>
                {t(
                  'customer.taskDetail.paymentNote',
                  'Payment is arranged directly with the Tasker',
                )}
              </Text>
            )}
          </View>
        )}
      </DetailTemplate>

      <TaskCancelSheet
        isOpen={showCancelSheet}
        onClose={() => setShowCancelSheet(false)}
        taskId={taskId}
        taskStatus={status}
        bookingId={(task as any)?.booking?.id}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.heroTitle,
    fontWeight: '800',
    color: colors.foreground,
    lineHeight: 36,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.label,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.foreground,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  applicantCount: {
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  noApplicants: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  taskerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  taskerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  taskerInfo: {
    flex: 1,
    gap: 4,
  },
  taskerName: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.foreground,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: typography.caption,
    color: colors.trustMuted,
    fontWeight: '600',
  },
  paymentNote: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
