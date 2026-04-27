import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useBookingDetail } from '@/features/bookings/hooks/useBookingDetail';
import { useFlagNoShow } from '@/features/bookings/hooks/useFlagNoShow';
import { useConversationRouteForBooking } from '@/features/chat';
import { buildTaskerProfileRoute } from '@/features/profile/profileRouteParams';

import { getCtaConfig } from './model';

export function useBookingDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(bookingId);
  const flagNoShow = useFlagNoShow();
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showNoShowSheet, setShowNoShowSheet] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);

  const status: string = booking?.status ?? 'ASSIGNED';
  const ctaConfig = getCtaConfig(booking, t);
  const { route: conversationRoute } = useConversationRouteForBooking({
    taskId: booking?.task_id ?? booking?.task?.id,
    counterpartyId: booking?.tasker_id ?? booking?.tasker?.id,
  });

  const handleCtaPress = useCallback(() => {
    if (!booking) return;
    const action = getCtaConfig(booking, t)?.action;
    switch (action) {
      case 'message':
        router.push(conversationRoute);
        break;
      case 'leave_review':
        router.push({
          pathname: '/(shared)/review/[bookingId]',
          params: { bookingId, role: 'customer' },
        });
        break;
      case 'confirm_complete':
        setShowCompletionSheet(true);
        break;
      case 'find_another_tasker': {
        const taskId = booking.task_id ?? booking.task?.id;
        if (taskId) {
          router.push(`/(customer)/tasks/${taskId}`);
        }
        break;
      }
      case 'rebook':
        router.push({
          pathname: '/(customer)/rebook',
          params: {
            bookingId,
            taskerId: booking.tasker?.id,
            taskerName: booking.tasker?.full_name,
            taskerAvatar: booking.tasker?.avatar_url,
            categoryId: booking.task?.category?.id,
            categoryName: booking.task?.category?.name,
            description: booking.task?.description,
            budget: String(booking.task?.budget),
            locationLat: String(booking.task?.location_lat),
            locationLng: String(booking.task?.location_lng),
            locationText: booking.task?.location_text,
            scheduledAt: booking.task?.scheduled_at,
          },
        });
        break;
    }
  }, [booking, bookingId, conversationRoute, t, router]);

  const handleTimeline = useCallback(
    () => router.push(`/(customer)/bookings/${bookingId}/timeline`),
    [router, bookingId],
  );

  const handleReschedule = useCallback(
    () => router.push(`/(customer)/bookings/${bookingId}/reschedule`),
    [router, bookingId],
  );

  const handleLeaveReview = useCallback(() => {
    router.push({
      pathname: '/(shared)/review/[bookingId]',
      params: { bookingId, role: 'customer' },
    });
  }, [router, bookingId]);

  const handleReportIssue = useCallback(() => {
    setShowSupportSheet(true);
  }, []);

  const handleSupportPrimary = useCallback(() => {
    setShowSupportSheet(false);
    router.push(`/(customer)/bookings/${bookingId}/dispute`);
  }, [router, bookingId]);

  const handleFlagNoShow = useCallback(() => {
    if (!bookingId) return;
    flagNoShow.mutate(
      { bookingId },
      {
        onSuccess: () => {
          setShowNoShowSheet(false);
          refetch();
        },
        onError: () => {
          Alert.alert(t('common.error'), t('customer.bookings.noShowError'));
        },
      },
    );
  }, [bookingId, flagNoShow, refetch, t]);

  const handleTaskerPress = useCallback(() => {
    const tasker = booking?.tasker;
    if (tasker?.id) {
      router.push(buildTaskerProfileRoute(tasker));
    }
  }, [booking?.tasker, router]);

  const handleCancelConfirmed = useCallback(() => {
    setShowCancelSheet(false);
    router.replace('/(customer)/bookings');
  }, [router]);

  return {
    booking,
    isLoading,
    isError,
    refetch,
    status,
    ctaConfig,
    showCompletionSheet,
    showCancelSheet,
    showNoShowSheet,
    showSupportSheet,
    setShowCompletionSheet,
    setShowCancelSheet,
    setShowNoShowSheet,
    setShowSupportSheet,
    handleCtaPress,
    handleTimeline,
    handleReschedule,
    handleLeaveReview,
    handleReportIssue,
    handleSupportPrimary,
    handleFlagNoShow,
    handleTaskerPress,
    handleCancelConfirmed,
    t,
  };
}
