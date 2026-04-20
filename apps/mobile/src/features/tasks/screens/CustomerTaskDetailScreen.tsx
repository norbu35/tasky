import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { TaskCancelSheet } from '../components/TaskCancelSheet';
import { CompletedBanner, CancelledBanner } from './CustomerTaskDetail.Banners';
import { PhotosSection } from './CustomerTaskDetail.Photos';

import { formatSchedule } from './CustomerTaskDetail.model';
import type { CustomerTask } from './CustomerTaskDetail.model';
import { TaskHeader } from './CustomerTaskDetail.Header';
import { DetailRow } from './CustomerTaskDetail.DetailRow';
import { IntakeAnswersSection } from './CustomerTaskDetail.IntakeAnswers';
import { BudgetCard } from './CustomerTaskDetail.BudgetCard';
import { ApplicantsSection } from './CustomerTaskDetail.ApplicantsSection';
import { LocationCard } from './CustomerTaskDetail.LocationCard';
import { TaskerCard } from './CustomerTaskDetail.TaskerCard';
import { useCustomerTaskDetailScreen } from './useCustomerTaskDetailScreen';

export default function CustomerTaskDetailScreen() {
  const { t } = useTranslation();
  const {
    taskId,
    task,
    isLoading,
    isError,
    refetch,
    status,
    isAssigned,
    isTaskerMarkedDone,
    isCompleted,
    isCancelled,
    hasApplicants,
    applicantCount,
    photos,
    tasker,
    bookingId,
    ctaLabel,
    ctaOnPress,
    secondaryCtaLabel,
    secondaryCtaOnPress,
    navigateToTasker,
    showCancelSheet,
    setShowCancelSheet,
  } = useCustomerTaskDetailScreen();

  return (
    <>
      <DetailTemplate
        testID="SCR-CUST-009"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        errorMessage={t('TaskDetailCustomerScreen.errorNetwork')}
        ctaLabel={ctaLabel}
        ctaOnPress={ctaOnPress}
        secondaryCtaLabel={secondaryCtaLabel}
        secondaryCtaOnPress={secondaryCtaOnPress}
      >
        {task ? (
          <View className="gap-lg">
            <TaskHeader status={status} description={task.description} t={t} />

            <View className="bg-muted rounded-sm p-lg gap-md">
              <DetailRow
                label={t('TaskDetailCustomerScreen.categoryLabel')}
                value={
                  (task as CustomerTask)?.category?.name ?? t('TaskDetailCustomerScreen.notSet')
                }
              />
              <DetailRow
                label={t('TaskDetailCustomerScreen.scheduleDate')}
                value={formatSchedule(task.scheduled_at)}
              />
            </View>

            {task.intake_answers != null &&
              typeof task.intake_answers === 'object' &&
              Object.keys(task.intake_answers).length > 0 && (
                <IntakeAnswersSection
                  answers={task.intake_answers as Record<string, unknown>}
                  t={t}
                />
              )}

            <BudgetCard budget={task.budget} applicantCount={applicantCount} t={t} />
            <ApplicantsSection
              hasApplicants={hasApplicants}
              applicantCount={applicantCount}
              t={t}
            />
            <PhotosSection photos={photos} t={t} />
            <LocationCard locationText={(task as CustomerTask).location_text} t={t} />

            {(isAssigned || isTaskerMarkedDone) && tasker ? (
              <TaskerCard tasker={tasker} onPress={() => navigateToTasker(tasker.id)} t={t} />
            ) : null}

            {isCompleted ? <CompletedBanner t={t} /> : null}
            {isCancelled ? <CancelledBanner t={t} /> : null}
          </View>
        ) : null}
      </DetailTemplate>

      <TaskCancelSheet
        isOpen={showCancelSheet}
        onClose={() => setShowCancelSheet(false)}
        taskId={taskId}
        taskStatus={status}
        bookingId={bookingId}
      />
    </>
  );
}
