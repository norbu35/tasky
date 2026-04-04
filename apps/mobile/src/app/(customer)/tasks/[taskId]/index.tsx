import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MapPin, Star } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { useCustomerTaskDetail } from '../../../../features/tasks/hooks/useCustomerTaskDetail';
import { TaskCancelSheet } from '../../../../features/tasks/components/TaskCancelSheet';

const { colors, spacing, typography, radius } = mobileTheme;

function formatBudget(value?: number | null) {
  if (typeof value !== 'number') {
    return '₮0';
  }
  return `₮${value.toLocaleString('en-US')}`;
}

function formatSchedule(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

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

  const tasker = (task as any)?.tasker;
  const hasApplicants = Number((task as any)?.applicant_count ?? 0) > 0;
  const photos = useMemo(() => ((task as any)?.photo_keys ?? []) as string[], [task]);

  const ctaLabel = useMemo(() => {
    if (isOpen && hasApplicants) {
      return t('customer.taskDetail.viewApplicants', 'View Applicants');
    }
    if (isTaskerMarkedDone) {
      return t('customer.taskDetail.markComplete', 'Confirm Complete');
    }
    if (isAssigned && tasker) {
      return t('customer.taskDetail.messageTasker', 'Message Tasker');
    }
    if (isOpen) {
      return t('customer.taskDetail.cancel', 'Cancel Task');
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, isTaskerMarkedDone, tasker, t]);

  const ctaOnPress = useMemo(() => {
    if (isOpen && hasApplicants) {
      return () => router.push(`/(customer)/tasks/${taskId}/applicants`);
    }
    if (isTaskerMarkedDone) {
      return () => {
        // Completion flow is handled elsewhere in the booking path.
      };
    }
    if (isAssigned && tasker) {
      return () => router.push('/inbox');
    }
    if (isOpen) {
      return () => setShowCancelSheet(true);
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, isTaskerMarkedDone, router, taskId, tasker]);

  const secondaryCtaLabel = useMemo(() => {
    if ((isOpen && hasApplicants) || isAssigned) {
      return t('customer.taskDetail.cancel', 'Cancel Task');
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, t]);

  const secondaryCtaOnPress = useMemo(() => {
    if ((isOpen && hasApplicants) || isAssigned) {
      return () => setShowCancelSheet(true);
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen]);

  return (
    <>
      <DetailTemplate
        testID="task-detail-customer-screen"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        errorMessage={t('customer.taskDetail.errorNetwork', 'Failed to load task detail')}
        ctaLabel={ctaLabel}
        ctaOnPress={ctaOnPress}
        secondaryCtaLabel={secondaryCtaLabel}
        secondaryCtaOnPress={secondaryCtaOnPress}
      >
        {task ? (
          <View style={styles.content}>
            <View style={styles.heroCard}>
              <StatusBadge
                status={
                  (status === 'TASKER_MARKED_DONE' ? 'assigned' : status.toLowerCase()) as
                    | 'open'
                    | 'assigned'
                    | 'completed'
                    | 'cancelled'
                    | 'no_show'
                }
              />
              <Text style={styles.title}>{task.description}</Text>
              <Text style={styles.subtitle}>
                {t('customer.taskDetail.sectionDetails', 'Details')}
              </Text>
            </View>

            <View style={styles.detailsCard}>
              <DetailRow
                label={t('customer.postTask.categoryLabel', 'Category')}
                value={(task as any)?.category?.name ?? t('customer.postTask.notSet', 'Not set')}
              />
              <DetailRow
                label={t('customer.postTask.scheduleDate', 'Date')}
                value={formatSchedule(task.scheduled_at)}
              />
            </View>

            <View style={styles.budgetCard}>
              <View style={styles.budgetCardTop}>
                <Text style={styles.budgetCardLabel}>
                  {t('customer.postTask.budgetLabel', 'Budget')}
                </Text>
                <View style={styles.applicantChip}>
                  <Text style={styles.applicantChipText}>
                    {Number((task as any)?.applicant_count ?? 0)}{' '}
                    {t('customer.applicants.title', 'applicants')}
                  </Text>
                </View>
              </View>
              <Text style={styles.budgetAmount}>{formatBudget(task.budget)}</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t('customer.taskDetail.applicants', 'Applicants')}
                </Text>
                <Text style={styles.sectionPill}>
                  {Number((task as any)?.applicant_count ?? 0)}
                </Text>
              </View>
              {hasApplicants ? (
                <Text style={styles.sectionBody}>
                  {t('customer.applicants.title', 'applications received')}
                </Text>
              ) : (
                <Text style={styles.sectionBody}>
                  {t('customer.taskDetail.noApplicants', 'No applicants yet')}
                </Text>
              )}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t('customer.taskDetail.sectionPhotos', 'Photos')}
                </Text>
                <Text style={styles.sectionPill}>{photos.length}</Text>
              </View>
              <View style={styles.photoGrid}>
                {photos.length > 0 ? (
                  photos.slice(0, 4).map((photoKey, index) => (
                    <View key={`${photoKey}-${index}`} style={styles.photoThumb}>
                      <Text style={styles.photoThumbText}>{index + 1}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sectionBody}>
                    {t('customer.taskDetail.noPhotos', 'No photos')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <MapPin size={16} color={colors.primaryDeep} />
                <Text style={styles.locationText}>{(task as any).location_text ?? ''}</Text>
              </View>
              <Text style={styles.locationNote}>
                {t(
                  'customer.taskDetail.locationNote',
                  'Taskers see approximate location until the booking is confirmed.',
                )}
              </Text>
            </View>

            {(isAssigned || isTaskerMarkedDone) && tasker ? (
              <Pressable
                style={styles.taskerCard}
                onPress={() => router.push(`/(customer)/taskers/${tasker.id}`)}
                testID="task-detail-customer-screen-tasker-card"
                accessibilityRole="button"
              >
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
                    <Text style={styles.taskerHint}>
                      {t('customer.taskDetail.assignedTasker', 'Assigned Tasker')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : null}

            {isCompleted ? (
              <View style={styles.terminalCard}>
                <Text style={styles.terminalTitle}>
                  {t('customer.taskDetail.completedTitle', 'Task completed')}
                </Text>
                <Text style={styles.terminalBody}>
                  {t('customer.taskDetail.completedBody', 'Thanks for using Tasky')}
                </Text>
              </View>
            ) : null}

            {isCancelled ? (
              <View style={styles.terminalCard}>
                <Text style={styles.terminalTitle}>
                  {t('customer.taskDetail.cancelledTitle', 'Task cancelled')}
                </Text>
                <Text style={styles.terminalBody}>
                  {t('customer.taskDetail.cancelledBody', 'This task is no longer active')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
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
  heroCard: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
    lineHeight: typography.heading * (4 / 3),
  },
  subtitle: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailLabel: {
    flex: 1,
    fontSize: typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  detailValue: {
    flex: 1,
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'right',
  },
  sectionCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.foreground,
  },
  sectionPill: {
    minWidth: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}12`,
    color: colors.primaryDeep,
    fontSize: typography.caption,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoThumb: {
    width: '48%',
    height: 163,
    borderRadius: radius.md,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbText: {
    fontSize: typography.body,
    color: colors.primaryDeep,
    fontWeight: '800',
  },
  locationCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: `${colors.primary}0F`,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  locationNote: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
  budgetCard: {
    backgroundColor: colors.primaryDeep,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...elevations.soft,
  },
  budgetCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetCardLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: `${colors.primaryForeground}99`,
  },
  applicantChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: `${colors.primaryForeground}1A`,
  },
  applicantChipText: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  budgetAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.secondary,
    lineHeight: 36 * (10 / 9),
  },
  taskerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...elevations.soft,
  },
  taskerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  taskerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  taskerName: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.foreground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
  },
  taskerHint: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  terminalCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: `${colors.muted}80`,
    gap: spacing.xs,
  },
  terminalTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  terminalBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
});
