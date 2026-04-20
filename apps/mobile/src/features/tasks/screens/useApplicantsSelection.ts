import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApplications } from '../hooks/useApplications';
import { useCustomerTaskDetail } from '../hooks/useCustomerTaskDetail';

import { type ApplicantItem } from './ApplicantsSelection.model';

export function useApplicantsSelection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId, id } = useLocalSearchParams<{ taskId?: string; id?: string }>();
  const resolvedTaskId = taskId ?? id ?? '';
  const { data, isLoading, isError, refetch } = useApplications(resolvedTaskId);
  const { task } = useCustomerTaskDetail(resolvedTaskId);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantItem | null>(null);
  const [declineNotification, setDeclineNotification] = useState<string | null>(null);

  const applicants: ApplicantItem[] = useMemo(
    () =>
      (data?.data ?? []).map((a, index: number) => ({
        id: a.id,
        taskerId: a.tasker?.id ?? a.task_id ?? '',
        name: a.tasker?.full_name ?? '',
        avatarUrl: a.tasker?.avatar_url ?? undefined,
        rating: a.tasker?.rating_avg ?? 0,
        reviewCount: a.tasker?.completed_tasks ?? 0,
        isVerified: a.tasker?.is_pro ?? false,
        isRecommended: Boolean(a.recommended ?? index === 0),
        message: a.message ?? '',
      })),
    [data?.data],
  );

  const handleAccept = (application: ApplicantItem) => {
    setSelectedApplicant(application);
  };

  const handleConfirmAccept = () => {
    if (!selectedApplicant) return;

    router.push({
      pathname: '/(customer)/bookings/confirm',
      params: {
        taskId: resolvedTaskId,
        applicationId: selectedApplicant.id,
        taskerId: selectedApplicant.taskerId,
        taskTitle: task?.description ?? t('customer.applicants.taskTitleFallback'),
        taskBudget: String(task?.budget ?? ''),
        taskSchedule: task?.scheduled_at ?? '',
        taskerName: selectedApplicant.name,
        taskerAvatar: selectedApplicant.avatarUrl ?? '',
        taskerRating: String(selectedApplicant.rating),
        source: 'application',
      },
    });
    setSelectedApplicant(null);
  };

  const handleViewProfile = (taskerId: string) => {
    router.push(`/(customer)/taskers/${taskerId}`);
  };

  return {
    resolvedTaskId,
    applicants,
    isLoading,
    isError,
    refetch,
    selectedApplicant,
    declineNotification,
    setDeclineNotification,
    handleAccept,
    handleConfirmAccept,
    handleViewProfile,
    dismissSheet: () => setSelectedApplicant(null),
    goBack: () => router.back(),
  };
}
