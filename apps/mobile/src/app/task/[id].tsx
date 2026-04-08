import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { PriceTag } from '../../components/ui/PriceTag';
import { CategoryChip } from '../../components/ui/CategoryChip';
import { LocationPin } from '../../components/ui/LocationPin';
import { PhotoGrid } from '../../components/ui/PhotoGrid';
import { TrustBanner } from '../../components/ui/TrustBanner';
import { useTaskDetail } from '../../features/tasks/hooks/useTasks';
import { ApplicationSentSuccess } from '../../features/tasks/components/ApplicationSentSuccess';
import { createMobileApiClient } from '../../lib/mobileApiClient';
import { useAuthStore } from '../../store/authStore';

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
    router.push('/(tasker)/verification' as any);
  }, [router]);

  const handleBrowseMore = useCallback(() => {
    router.replace('/(tabs)' as any);
  }, [router]);

  const handleViewTask = useCallback(() => {
    setShowSuccess(false);
  }, []);

  const handleMessageCustomer = useCallback(() => {
    router.push(`/inbox/${taskId}` as any);
  }, [router, taskId]);

  // Show success celebration inline after applying
  if (showSuccess) {
    return <ApplicationSentSuccess onBrowseMore={handleBrowseMore} onViewTask={handleViewTask} />;
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
    <>
      <Stack.Screen options={{ title: t('taskDetails.title') }} />
      <DetailTemplate
        ctaLabel={ctaLabel}
        ctaOnPress={ctaOnPress}
        ctaLoading={isApplying}
        ctaDisabled={ctaDisabled}
        secondaryCtaLabel={isVerified ? t('tasker.taskDetail.messageButton', 'Message') : undefined}
        secondaryCtaOnPress={isVerified ? handleMessageCustomer : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        testID="SCR-TASK-002"
      >
        {task && (
          <View className="gap-lg">
            {/* Customer info */}
            <View className="flex-row items-center gap-sm bg-muted rounded-md p-md">
              <Text className="text-subtitle font-semibold text-foreground">
                {task.customer.full_name}
              </Text>
              {task.customer.rating_avg > 0 && (
                <Text className="text-label font-semibold text-secondary">
                  {task.customer.rating_avg.toFixed(1)}
                </Text>
              )}
            </View>

            {/* Task description */}
            <Text className="text-body text-foreground leading-[26px]">{task.description}</Text>

            {/* Budget */}
            <View className="gap-xs bg-muted rounded-md p-md">
              <Text className="text-caption font-semibold text-textSecondary uppercase tracking-[0.5px]">
                {t('taskDetails.budget')}
              </Text>
              <PriceTag amount={task.budget} size="lg" />
            </View>

            {/* Category */}
            {task.category && (
              <View className="gap-xs bg-muted rounded-md p-md">
                <CategoryChip label={task.category.name} isActive />
              </View>
            )}

            {/* Location */}
            {task.approximate_location && (
              <View className="gap-xs bg-muted rounded-md p-md">
                <Text className="text-caption font-semibold text-textSecondary uppercase tracking-[0.5px]">
                  {t('taskDetails.location')}
                </Text>
                <LocationPin text={task.approximate_location} />
                <Text className="text-caption text-textSecondary leading-[20px] mt-xs">
                  {t(
                    'tasker.taskDetail.locationApproximateNote',
                    'Approximate location (exact address shown after booking confirmed)',
                  )}
                </Text>
              </View>
            )}

            {/* Schedule */}
            {task.scheduled_at && (
              <View className="gap-xs bg-muted rounded-md p-md">
                <Text className="text-caption font-semibold text-textSecondary uppercase tracking-[0.5px]">
                  {t('taskDetail.dateTime', 'Date & Time')}
                </Text>
                <Text className="text-body text-foreground">
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

            {task.photo_urls.length > 0 && (
              <View className="gap-xs bg-muted rounded-md p-md">
                <Text className="text-caption font-semibold text-textSecondary uppercase tracking-[0.5px]">
                  {t('tasker.taskDetail.photosLabel', 'Photos')}
                </Text>
                <PhotoGrid photos={task.photo_urls} testID="task-detail-photos" />
              </View>
            )}

            {/* Application count */}
            {task.application_count > 0 && (
              <Text className="text-label text-textSecondary mt-sm">
                {task.application_count} {t('customer.taskDetail.applicants', 'applicants')}
              </Text>
            )}

            <TrustBanner
              title={t('tasker.taskDetail.trustTitle', 'Platform trust')}
              description={t(
                'tasker.taskDetail.trustDescription',
                'Verified taskers and consistent reviews help protect both sides of every booking.',
              )}
              variant="compact"
            />
          </View>
        )}
      </DetailTemplate>
    </>
  );
}
