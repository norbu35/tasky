import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { PriceTag } from '../../../../components/ui/PriceTag';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { ConfirmCompletionSheet } from '../../../../features/bookings/components/ConfirmCompletionSheet';
import {
  CustomerCancelSheet,
  type CancelType,
} from '../../../../features/bookings/components/CustomerCancelSheet';
import { ConfirmSheet } from '../../../../components/ui/ConfirmSheet';

function mapStatus(status: string): 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show' {
  const lower = status.toLowerCase();
  if (lower === 'assigned' || lower === 'tasker_marked_done') return 'assigned';
  if (lower === 'completed') return 'completed';
  if (lower === 'cancelled') return 'cancelled';
  if (lower === 'no_show') return 'no_show';
  return 'assigned';
}

function getStatusLabel(status: string, t: (key: string) => string): string {
  switch (status) {
    case 'ASSIGNED':
      return t('customer.bookings.statusAssigned');
    case 'TASKER_MARKED_DONE':
      return t('customer.bookings.statusMarkedDone');
    case 'COMPLETED':
      return t('customer.bookings.statusCompleted');
    case 'CANCELLED':
      return t('customer.bookings.statusCancelled');
    case 'NO_SHOW':
      return t('customer.bookings.statusNoShow');
    default:
      return status;
  }
}

function getCtaConfig(
  booking: any,
  t: (key: string) => string,
): { label: string; action: string } | null {
  switch (booking?.status) {
    case 'ASSIGNED':
      return { label: t('customer.bookings.ctaMessage'), action: 'message' };
    case 'TASKER_MARKED_DONE':
      return {
        label: t('customer.bookings.ctaConfirmComplete'),
        action: 'confirm_complete',
      };
    case 'COMPLETED':
      return hasSubmittedReview(booking)
        ? { label: t('customer.bookings.ctaRebook'), action: 'rebook' }
        : { label: t('customer.bookings.ctaLeaveReview'), action: 'leave_review' };
    default:
      return null;
  }
}

function hasSubmittedReview(booking: any): boolean {
  return Boolean(
    booking?.customer_review_submitted_at ??
    booking?.review_submitted_at ??
    booking?.review?.submitted_at,
  );
}

function getCancelType(booking: any): CancelType {
  const scheduledAt = booking?.task?.scheduled_at;
  if (!scheduledAt) return 'free_cancel';

  const fourHoursMs = 4 * 60 * 60 * 1000;
  const timeUntilScheduled = new Date(scheduledAt).getTime() - Date.now();
  if (timeUntilScheduled >= fourHoursMs) {
    return 'free_cancel';
  }

  const recentIncidents =
    booking?.customer_incidents_28d ??
    booking?.customer?.incidents_28d ??
    booking?.incidents_28d ??
    0;
  return recentIncidents > 0 ? 'late_cancel_incident_count' : 'late_cancel_warning';
}

export default function BookingDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(bookingId);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
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

  return (
    <DetailTemplate
      testID="SCR-CUST-017"
      ctaLabel={ctaConfig?.label}
      ctaOnPress={ctaConfig ? handleCtaPress : undefined}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    >
      {booking && (
        <>
          {/* Status */}
          <View className="flex-row justify-between items-center mb-xl">
            <Text className="text-subtitle font-semibold text-primary">
              {getStatusLabel(status, t)}
            </Text>
            <StatusBadge status={mapStatus(status)} />
          </View>

          {/* Tasker Info */}
          <View className="mb-xl">
            <Text className="text-heading font-bold text-primaryDeep mb-md">
              {t('customer.bookings.sectionTasker')}
            </Text>
            <Pressable
              className="flex-row items-center gap-md bg-muted rounded-md p-md mt-xs"
              onPress={() => router.push(`/(customer)/taskers/${booking.tasker?.id}`)}
              testID="booking-detail-screen-tasker-card"
            >
              <ProfileAvatar
                uri={booking.tasker?.avatar_url}
                name={booking.tasker?.full_name}
                size="lg"
                showVerified
              />
              <View className="flex-1">
                <Text className="text-body font-semibold text-primaryDeep">
                  {booking.tasker?.full_name}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Task Summary */}
          <View className="mb-xl">
            <Text className="text-heading font-bold text-primaryDeep mb-md">
              {t('customer.bookings.sectionTaskSummary')}
            </Text>
            <Text className="text-body text-primaryDeep mb-sm">{booking.task?.description}</Text>
            {booking.task?.location_text && (
              <Text className="text-caption text-textSecondary mb-sm">
                {booking.task.location_text}
              </Text>
            )}
            {booking.task?.scheduled_at && (
              <Text className="text-caption text-textSecondary mb-sm">
                {new Date(booking.task.scheduled_at).toLocaleDateString()}
              </Text>
            )}
            {booking.task?.budget && <PriceTag amount={booking.task.budget} size="sm" />}
          </View>

          {/* Payment Note */}
          <View className="mb-xl">
            <Text className="text-caption text-accent italic">
              {t('customer.bookings.paymentNote')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-md mb-xl">
            <Pressable
              className="py-sm"
              onPress={handleTimeline}
              testID="booking-detail-screen-timeline-link"
            >
              <Text className="text-body text-primary font-medium">
                {t('customer.bookings.ctaTimeline')}
              </Text>
            </Pressable>

            {status === 'ASSIGNED' && (
              <>
                <Pressable
                  className="py-sm"
                  onPress={handleReschedule}
                  testID="booking-detail-screen-reschedule-link"
                >
                  <Text className="text-body text-primary font-medium">
                    {t('customer.bookings.ctaReschedule')}
                  </Text>
                </Pressable>
                <Pressable
                  className="py-sm"
                  onPress={() => setShowCancelSheet(true)}
                  testID="booking-detail-screen-cancel-btn"
                >
                  <Text className="text-body text-danger font-medium">
                    {t('customer.bookings.ctaCancel')}
                  </Text>
                </Pressable>
              </>
            )}

            {status === 'TASKER_MARKED_DONE' && (
              <Pressable
                className="py-sm"
                onPress={handleReportIssue}
                testID="booking-detail-screen-report-issue-link"
              >
                <Text className="text-body text-danger font-medium">
                  {t('customer.bookings.ctaReportIssue')}
                </Text>
              </Pressable>
            )}

            {status === 'COMPLETED' && !hasSubmittedReview(booking) && (
              <Pressable
                className="py-sm"
                onPress={handleLeaveReview}
                testID="booking-detail-screen-review-link"
              >
                <Text className="text-body text-primary font-medium">
                  {t('shared.review.title')}
                </Text>
              </Pressable>
            )}

            {(status === 'CANCELLED' || status === 'NO_SHOW') && (
              <Pressable
                className="py-sm"
                onPress={handleReportIssue}
                testID="booking-detail-screen-report-issue-link"
              >
                <Text className="text-body text-danger font-medium">
                  {t('customer.bookings.ctaReportIssue')}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Confirm Completion Sheet */}
          <ConfirmCompletionSheet
            isOpen={showCompletionSheet}
            onClose={() => setShowCompletionSheet(false)}
            bookingId={bookingId}
            onCompleted={() => {
              setShowCompletionSheet(false);
              refetch();
            }}
          />
          <CustomerCancelSheet
            isOpen={showCancelSheet}
            onClose={() => setShowCancelSheet(false)}
            bookingId={bookingId}
            cancelType={getCancelType(booking)}
            onCancelled={() => {
              setShowCancelSheet(false);
              router.replace('/(customer)/bookings');
            }}
          />
          <ConfirmSheet
            testID="SCR-CUST-018"
            isOpen={showCompleteSheet}
            onClose={() => setShowCompleteSheet(false)}
            title={t('customer.confirmComplete.title')}
            description={t('BookingDetailScreen.copy1')}
            confirmLabel={t('customer.confirmComplete.confirm')}
            onConfirm={() => {
              // TODO: wire real completion API
              setShowCompleteSheet(false);
            }}
          />
          <ConfirmSheet
            testID="SCR-CUST-021"
            isOpen={showNoShowSheet}
            onClose={() => setShowNoShowSheet(false)}
            title={t('customer.noShow.title')}
            description={t('BookingDetailScreen.copy2')}
            confirmLabel={t('customer.noShow.confirm')}
            onConfirm={() => {
              // TODO: wire real no-show API
              setShowNoShowSheet(false);
            }}
            isDestructive
          />
        </>
      )}
    </DetailTemplate>
  );
}
