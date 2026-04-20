import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCustomerTaskDetail } from '@/features/tasks/hooks/useCustomerTaskDetail';
import type { CustomerTask } from './model';

export interface CustomerTaskDetailState {
  taskId: string;
  task: CustomerTask | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  status: string;
  isOpen: boolean;
  isAssigned: boolean;
  isTaskerMarkedDone: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  hasApplicants: boolean;
  applicantCount: number;
  photos: string[];
  tasker: CustomerTask['tasker'];
  bookingId: string | undefined;
  ctaLabel: string | undefined;
  ctaOnPress: (() => void) | undefined;
  secondaryCtaLabel: string | undefined;
  secondaryCtaOnPress: (() => void) | undefined;
  navigateToTasker: (taskerId: string) => void;
  showCancelSheet: boolean;
  setShowCancelSheet: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCustomerTaskDetailScreen(): CustomerTaskDetailState {
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

  const tasker = (task as CustomerTask)?.tasker;
  const applicantCount = Number((task as CustomerTask)?.applicant_count ?? 0);
  const hasApplicants = applicantCount > 0;
  const photos = useMemo(() => ((task as CustomerTask)?.photo_keys ?? []) as string[], [task]);
  const bookingId = (task as CustomerTask)?.booking?.id;

  const ctaLabel = useMemo(() => {
    if (isOpen && hasApplicants) {
      return t('TaskDetailCustomerScreen.viewApplicants');
    }
    if (isTaskerMarkedDone) {
      return t('TaskDetailCustomerScreen.markComplete');
    }
    if (isAssigned && tasker) {
      return t('TaskDetailCustomerScreen.messageTasker');
    }
    if (isOpen) {
      return t('TaskDetailCustomerScreen.cancel');
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, isTaskerMarkedDone, tasker, t]);

  const ctaOnPress = useMemo(() => {
    if (isOpen && hasApplicants) {
      return () => router.push(`/(customer)/tasks/${taskId}/applicants`);
    }
    if (isTaskerMarkedDone) {
      return () => {
        if (bookingId) router.push(`/(customer)/bookings/${bookingId}`);
      };
    }
    if (isAssigned && tasker) {
      return () => router.push(bookingId ? `/inbox/${bookingId}` : '/inbox');
    }
    if (isOpen) {
      return () => setShowCancelSheet(true);
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, isTaskerMarkedDone, router, bookingId, taskId, tasker]);

  const secondaryCtaLabel = useMemo(() => {
    if ((isOpen && hasApplicants) || isAssigned) {
      return t('TaskDetailCustomerScreen.cancel');
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, t]);

  const secondaryCtaOnPress = useMemo(() => {
    if ((isOpen && hasApplicants) || isAssigned) {
      return () => setShowCancelSheet(true);
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen]);

  const navigateToTasker = React.useCallback(
    (taskerId: string) => {
      router.push(`/(customer)/taskers/${taskerId}`);
    },
    [router],
  );

  return {
    taskId,
    task: task as CustomerTask | null,
    isLoading,
    isError,
    refetch,
    status,
    isOpen,
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
  };
}
