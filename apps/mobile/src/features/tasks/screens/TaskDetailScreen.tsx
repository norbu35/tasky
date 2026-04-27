import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { PhotoGrid } from '@/components/ui/PhotoGrid';
import { Toast } from '@/components/ui/Toast';
import { applyToTask } from '@/features/tasks/api';
import { ApplicationSentSuccess } from '@/features/tasks/components/ApplicationSentSuccess';
import { useTaskDetail } from '@/features/tasks/hooks/useTasks';
import type { PublicTask, TaskDetail } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';

import { ApplicationForm } from './TaskDetail.ApplicationForm';
import { TaskDetailSummary } from './TaskDetail.Summary';

interface TaskDetailScreenProps {
  id: string;
}

function getTaskCustomerId(task: TaskDetail | null): string | null {
  if (!task) return null;
  if ('customer' in task) return task.customer?.id ?? null;
  if ('customer_id' in task) return task.customer_id ?? null;
  return null;
}

function getTaskPhotoUrls(task: TaskDetail): string[] {
  if ('photo_urls' in task) return task.photo_urls;
  return task.photos.flatMap((photo) => (photo.url ? [photo.url] : []));
}

function hasPublicCustomer(task: TaskDetail | null): task is PublicTask {
  return !!task && 'customer' in task && !!task.customer;
}

export default function TaskDetailScreen({ id }: TaskDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const taskId = id ?? '';

  const { task, isLoading, isError, isVerified, hasApplied, capReached, refetch } =
    useTaskDetail(taskId);

  const session = useAuthStore((s) => s.session);
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localApplied, setLocalApplied] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [applicationNote, setApplicationNote] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const appliedState = hasApplied || localApplied;
  const pricingMode = task?.pricing_mode ?? 'BUDGET';
  const quotePriceNumber = Number(quotePrice);
  const isQuoteMode = pricingMode === 'QUOTE';
  const isApplicationNoteValid = applicationNote.trim().length > 0;
  const isQuoteValid =
    !isQuoteMode ||
    (quotePrice !== '' && Number.isFinite(quotePriceNumber) && quotePriceNumber >= 20000);
  const canSubmitApplication = isApplicationNoteValid && isQuoteValid;
  const isOwnTask = getTaskCustomerId(task) === session?.user.id;
  const hasCustomerProfile = hasPublicCustomer(task);
  const canStartApplication =
    isVerified && hasCustomerProfile && !isOwnTask && !appliedState && !capReached;
  const photoUrls = task ? getTaskPhotoUrls(task) : [];

  const handleApply = useCallback(async () => {
    if (!session?.accessToken || !taskId || !canSubmitApplication || !canStartApplication) return;
    setIsApplying(true);
    setApplicationError(null);
    try {
      await applyToTask(
        session.accessToken,
        taskId,
        applicationNote.trim(),
        isQuoteMode ? quotePriceNumber : null,
      );
      setLocalApplied(true);
      setShowSuccess(true);
    } catch {
      setApplicationError(t('tasker.taskDetail.applyError'));
    } finally {
      setIsApplying(false);
    }
  }, [
    applicationNote,
    canStartApplication,
    canSubmitApplication,
    isQuoteMode,
    quotePriceNumber,
    session,
    taskId,
    t,
  ]);

  const handleGetVerified = useCallback(() => {
    router.push('/(tasker)/verification' as `${string}`);
  }, [router]);

  const handleBrowseMore = useCallback(() => {
    router.replace('/(tabs)' as `${string}`);
  }, [router]);

  const handleViewTask = useCallback(() => {
    setShowSuccess(false);
  }, []);

  // Show success celebration inline after applying
  if (showSuccess) {
    return <ApplicationSentSuccess onBrowseMore={handleBrowseMore} onViewTask={handleViewTask} />;
  }

  // Determine CTA label and action
  let ctaLabel: string | undefined;
  let ctaOnPress: (() => void) | undefined;
  let ctaDisabled = false;

  const noop = () => {};

  if (!task) {
    ctaLabel = undefined;
  } else if (isOwnTask) {
    ctaLabel = t('tasker.taskDetail.ownTaskCta');
    ctaDisabled = true;
    ctaOnPress = noop;
  } else if (appliedState) {
    ctaLabel = t('tasker.taskDetail.alreadyApplied');
    ctaDisabled = true;
    ctaOnPress = noop;
  } else if (capReached) {
    ctaLabel = t('tasker.browse.capReached');
    ctaDisabled = true;
    ctaOnPress = noop;
  } else if (isVerified && hasCustomerProfile) {
    ctaLabel = t('tasker.taskDetail.applyButton');
    ctaOnPress = handleApply;
    ctaDisabled = !canSubmitApplication;
  } else if (hasCustomerProfile) {
    ctaLabel = t('tasker.taskDetail.getVerified');
    ctaOnPress = handleGetVerified;
  }

  return (
    <DetailTemplate
      ctaLabel={ctaLabel}
      ctaOnPress={ctaOnPress}
      ctaLoading={isApplying}
      ctaDisabled={ctaDisabled}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      testID="SCR-TASK-002"
    >
      {task && (
        <View className="gap-lg">
          <TaskDetailSummary task={task} isQuoteMode={isQuoteMode} />

          {isOwnTask ? (
            <Toast message={t('tasker.taskDetail.ownTaskNotice')} variant="info" />
          ) : null}

          {applicationError ? <Toast message={applicationError} variant="error" /> : null}

          {canStartApplication ? (
            <ApplicationForm
              isQuoteMode={isQuoteMode}
              isQuoteValid={isQuoteValid}
              applicationNote={applicationNote}
              quotePrice={quotePrice}
              onApplicationNoteChange={setApplicationNote}
              onQuotePriceChange={setQuotePrice}
            />
          ) : null}

          {/* Photos */}
          {photoUrls.length > 0 && (
            <View className="gap-xs bg-muted rounded-md p-md">
              <Text className="text-caption font-sans-semibold text-text-secondary uppercase tracking-normal">
                {t('tasker.taskDetail.photosLabel')}
              </Text>
              <PhotoGrid photos={photoUrls} testID="task-detail-photos" />
            </View>
          )}
        </View>
      )}
    </DetailTemplate>
  );
}
