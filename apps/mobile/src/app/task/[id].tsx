import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react-native';
import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { ProfileAvatar } from '../../components/ui/ProfileAvatar';
import { PriceTag } from '../../components/ui/PriceTag';
import { CategoryChip } from '../../components/ui/CategoryChip';
import { LocationPin } from '../../components/ui/LocationPin';
import { PhotoGrid } from '../../components/ui/PhotoGrid';
import { useTaskDetail } from '../../features/tasks/hooks/useTasks';
import { ApplicationSentSuccess } from '../../features/tasks/components/ApplicationSentSuccess';
import { createMobileApiClient } from '../../lib/mobileApiClient';
import { useAuthStore } from '../../store/authStore';
import { formatFullDate } from '../../utils/formatDate';
import { mobileTheme } from '../../design/tokenAdapter';

const api = createMobileApiClient();
const { colors } = mobileTheme;

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
        secondaryCtaLabel={isVerified ? t('tasker.taskDetail.messageButton') : undefined}
        secondaryCtaOnPress={isVerified ? handleMessageCustomer : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        testID="SCR-TASK-002"
      >
        {task && (
          <View className="gap-lg">
            {/* Customer hero — avatar, name, rating */}
            <View className="flex-row items-center gap-md bg-muted rounded-md p-lg">
              <ProfileAvatar
                uri={undefined}
                name={task.customer.full_name}
                size="lg"
              />
              <View className="flex-1 gap-xs">
                <Text className="text-subtitle font-sans-bold text-foreground">
                  {task.customer.full_name}
                </Text>
                {task.customer.rating_avg > 0 && (
                  <View className="flex-row items-center gap-xs">
                    <Star size={14} color={colors.accent} fill={colors.accent} />
                    <Text className="text-label font-sans-bold text-foreground">
                      {task.customer.rating_avg.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Task description — hero element */}
            <Text className="text-heading font-sans-bold text-primary-deep leading-tight">
              {task.description}
            </Text>

            {/* Task details — budget, category, location, schedule inline */}
            <View className="bg-muted rounded-md p-lg gap-md">
              {task.category && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
                    {t('TaskDetailCustomerScreen.categoryLabel')}
                  </Text>
                  <CategoryChip label={task.category.name} isActive />
                </View>
              )}

              <View className="flex-row items-center justify-between">
                <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
                  {t('taskDetails.budget')}
                </Text>
                <PriceTag amount={task.budget} size="sm" />
              </View>

              {task.approximate_location && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
                    {t('taskDetails.location')}
                  </Text>
                  <LocationPin text={task.approximate_location} compact />
                </View>
              )}

              {task.scheduled_at && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
                    {t('taskDetail.dateTime')}
                  </Text>
                  <Text className="text-label font-sans-medium text-foreground">
                    {formatFullDate(task.scheduled_at)}
                  </Text>
                </View>
              )}
            </View>

            {/* Location note */}
            {task.approximate_location && (
              <Text className="text-caption text-text-secondary leading-[20px]">
                {t('TaskDetailScreen.copy1')}
              </Text>
            )}

            {/* Photos */}
            {task.photo_urls.length > 0 && (
              <View className="gap-xs bg-muted rounded-md p-md">
                <Text className="text-caption font-semibold text-text-secondary uppercase tracking-[0.5px]">
                  {t('tasker.taskDetail.photosLabel')}
                </Text>
                <PhotoGrid photos={task.photo_urls} testID="task-detail-photos" />
              </View>
            )}

            {/* Application count */}
            {task.application_count > 0 && (
              <Text className="text-label text-text-secondary mt-sm">
                {task.application_count} {t('TaskDetailCustomerScreen.applicants')}
              </Text>
            )}
          </View>
        )}
      </DetailTemplate>
    </>
  );
}
