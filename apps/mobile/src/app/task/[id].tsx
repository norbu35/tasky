import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { PriceTag } from '../../components/ui/PriceTag';
import { CategoryChip } from '../../components/ui/CategoryChip';
import { LocationPin } from '../../components/ui/LocationPin';
import { useTaskDetail } from '../../features/tasks/hooks/useTasks';
import { ApplicationSentSuccess } from '../../features/tasks/components/ApplicationSentSuccess';
import { VerificationGate } from '../../features/tasks/components/VerificationGate';
import { createMobileApiClient } from '../../lib/mobileApiClient';
import { useAuthStore } from '../../store/authStore';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;
const api = createMobileApiClient();

export default function TaskDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = id ?? '';

  const { task, isLoading, isError, isVerified, hasApplied, capReached, refetch } =
    useTaskDetail(taskId);

  const session = useAuthStore((s) => s.session);
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showVerificationGate, setShowVerificationGate] = useState(false);
  const [localApplied, setLocalApplied] = useState(false);
  const appliedState = hasApplied || localApplied;

  const handleApply = useCallback(async () => {
    if (!session?.accessToken || !taskId) return;
    setIsApplying(true);
    try {
      await api.applyToTask(session.accessToken, taskId, '');
      setLocalApplied(true);
      setShowSuccess(true);
    } catch {
      // Error handling would go here
    } finally {
      setIsApplying(false);
    }
  }, [session, taskId]);

  const handleGetVerified = useCallback(() => {
    setShowVerificationGate(true);
  }, []);

  const handleStartVerification = useCallback(() => {
    router.push('/verification' as any);
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleBrowseMore = useCallback(() => {
    router.replace('/(tabs)' as any);
  }, [router]);

  const handleViewTask = useCallback(() => {
    setShowSuccess(false);
  }, []);

  // Show success celebration inline after applying
  if (showSuccess) {
    return <ApplicationSentSuccess onBrowseMore={handleBrowseMore} onViewTask={handleViewTask} />;
  }

  // Show verification gate inline
  if (showVerificationGate) {
    return (
      <VerificationGate
        onStartVerification={handleStartVerification}
        onMaybeLater={() => setShowVerificationGate(false)}
      />
    );
  }

  // Determine CTA label and action
  let ctaLabel: string | undefined;
  let ctaOnPress: (() => void) | undefined;
  let ctaDisabled = false;

  const noop = () => {};

  if (appliedState) {
    ctaLabel = t('tasker.taskDetail.alreadyApplied');
    ctaDisabled = true;
    ctaOnPress = noop;
  } else if (capReached) {
    ctaLabel = t('tasker.browse.capReached');
    ctaDisabled = true;
    ctaOnPress = noop;
  } else if (isVerified) {
    ctaLabel = t('tasker.taskDetail.applyButton');
    ctaOnPress = handleApply;
  } else {
    ctaLabel = t('tasker.taskDetail.getVerified');
    ctaOnPress = handleGetVerified;
  }

  return (
    <DetailTemplate
      headerTitle={t('taskDetails.title')}
      onBack={handleBack}
      ctaLabel={ctaLabel}
      ctaOnPress={ctaOnPress}
      ctaLoading={isApplying}
      ctaDisabled={ctaDisabled}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      testID="task-detail"
    >
      {task && (
        <View style={styles.content}>
          {/* Customer info */}
          <View style={styles.customerSection}>
            <Text style={styles.customerName}>{task.customer.full_name}</Text>
            {task.customer.rating_avg > 0 && (
              <Text style={styles.customerRating}>{task.customer.rating_avg.toFixed(1)}</Text>
            )}
          </View>

          {/* Task description */}
          <Text style={styles.description}>{task.description}</Text>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('taskDetails.budget')}</Text>
            <PriceTag amount={task.budget} size="lg" />
          </View>

          {/* Category */}
          {task.category && (
            <View style={styles.section}>
              <CategoryChip label={task.category.name} isActive />
            </View>
          )}

          {/* Location */}
          {task.approximate_location && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('taskDetails.location')}</Text>
              <LocationPin text={task.approximate_location} />
            </View>
          )}

          {/* Schedule */}
          {task.scheduled_at && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('taskDetail.dateTime', 'Date & Time')}</Text>
              <Text style={styles.scheduleText}>
                {new Date(task.scheduled_at).toLocaleDateString('en', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          {/* Application count */}
          {task.application_count > 0 && (
            <Text style={styles.applicantCount}>
              {task.application_count} {t('customer.taskDetail.applicants', 'applicants')}
            </Text>
          )}
        </View>
      )}
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customerName: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.foreground,
  },
  customerRating: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.secondary,
  },
  description: {
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: typography.body * 1.6,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleText: {
    fontSize: typography.body,
    color: colors.foreground,
  },
  applicantCount: {
    fontSize: typography.label,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
