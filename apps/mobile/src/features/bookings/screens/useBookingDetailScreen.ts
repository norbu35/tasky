import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useBookingDetail } from '../hooks/useBookingDetail';
import { useFlagNoShow } from '../hooks/useFlagNoShow';
import { getCtaConfig, type CustomerBooking } from './BookingDetail.model';

export interface BookingDetailScreenState {
  booking: CustomerBooking | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  status: string;
  ctaConfig: { label: string; action: string } | null;
  showCompletionSheet: boolean;
  showCancelSheet: boolean;
  showNoShowSheet: boolean;
  setShowCompletionSheet: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCancelSheet: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNoShowSheet: React.Dispatch<React.SetStateAction<boolean>>;
  handleCtaPress: () => void;
  handleTimeline: () => void;
  handleReschedule: () => void;
  handleLeaveReview: () => void;
  handleReportIssue: () => void;
  handleFlagNoShow: () => void;
  handleTaskerPress: () => void;
  handleCancelConfirmed: () => void;
  t: (key: string) => string;
}

export function useBookingDetailScreen(): BookingDetailScreenState {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(bookingId);
  const flagNoShow = useFlagNoShow();
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showNoShowSheet, setShowNoShowSheet] = useState(false);

  const status: string = booking?.status ?? 'ASSIGNED';
  const ctaConfig = getCtaConfig(booking, t);

  const handleCtaPress = useCallback(() => {
    if (!booking) return;
    const action = getCtaConfig(booking, t)?.action;
    switch (action) {
      case 'message':
        router.push(`/inbox/${booking.id}`);
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
  }, [booking, bookingId, t, router]);

  const handleTimeline = useCallback(() => {
    router.push(`/(customer)/bookings/${bookingId}/timeline`);
  }, [router, bookingId]);

  const handleReschedule = useCallback(() => {
    router.push(`/(customer)/bookings/${bookingId}/reschedule`);
  }, [router, bookingId]);

  const handleLeaveReview = useCallback(() => {
    router.push({
      pathname: '/(shared)/review/[bookingId]',
      params: { bookingId, role: 'customer' },
    });
  }, [router, bookingId]);

  const handleReportIssue = useCallback(() => {
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
    if (booking?.tasker?.id) {
      router.push(`/(customer)/taskers/${booking.tasker.id}`);
    }
  }, [booking?.tasker?.id, router]);

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
    setShowCompletionSheet,
    setShowCancelSheet,
    setShowNoShowSheet,
    handleCtaPress,
    handleTimeline,
    handleReschedule,
    handleLeaveReview,
    handleReportIssue,
    handleFlagNoShow,
    handleTaskerPress,
    handleCancelConfirmed,
    t,
  };
}
