import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { PhotoGrid } from '@/components/ui/PhotoGrid';
import { applyToTask } from '@/features/tasks/api';
import { ApplicationSentSuccess } from '@/features/tasks/components/ApplicationSentSuccess';
import { useTaskDetail } from '@/features/tasks/hooks/useTasks';
import { useAuthStore } from '@/store/authStore';

import { ApplicationForm } from './TaskDetail.ApplicationForm';
import { TaskDetailSummary } from './TaskDetail.Summary';

interface TaskDetailScreenProps {
  id: string;
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

  const handleApply = useCallback(async () => {
    if (!session?.accessToken || !taskId || !canSubmitApplication) return;
    setIsApplying(true);
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
      // Error handling would go here
    } finally {
      setIsApplying(false);
    }
  }, [applicationNote, canSubmitApplication, isQuoteMode, quotePriceNumber, session, taskId]);

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
    ctaDisabled = !canSubmitApplication;
  } else {
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

          {isVerified && !appliedState && !capReached ? (
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
  );
}
