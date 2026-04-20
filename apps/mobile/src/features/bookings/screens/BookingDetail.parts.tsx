import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Touchable } from '@/components/ui/Touchable';

import {
  getStatusLabel,
  mapStatus,
  hasSubmittedReview,
  type CustomerBooking,
} from './BookingDetail.model';

interface StatusSectionProps {
  status: string;
}

export function StatusSection({ status }: StatusSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row justify-between items-center mb-xl">
      <Text className="text-subtitle font-semibold text-primary">{getStatusLabel(status, t)}</Text>
      <StatusBadge status={mapStatus(status)} />
    </View>
  );
}

interface TaskerSectionProps {
  booking: CustomerBooking;
  onTaskerPress: () => void;
}

export function TaskerSection({ booking, onTaskerPress }: TaskerSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-xl">
      <Text className="text-heading font-bold text-primary-deep mb-md">
        {t('customer.bookings.sectionTasker')}
      </Text>
      <Touchable
        className="flex-row items-center gap-md bg-muted rounded-md p-md mt-xs"
        onPress={onTaskerPress}
        testID="booking-detail-screen-tasker-card"
      >
        <ProfileAvatar
          uri={booking.tasker?.avatar_url}
          name={booking.tasker?.full_name}
          size="lg"
          showVerified
        />
        <View className="flex-1">
          <Text className="text-body font-semibold text-primary-deep">
            {booking.tasker?.full_name}
          </Text>
        </View>
      </Touchable>
    </View>
  );
}

interface TaskSummarySectionProps {
  booking: CustomerBooking;
}

export function TaskSummarySection({ booking }: TaskSummarySectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-xl">
      <Text className="text-heading font-bold text-primary-deep mb-md">
        {t('customer.bookings.sectionTaskSummary')}
      </Text>
      <Text className="text-body text-primary-deep mb-sm">{booking.task?.description}</Text>
      {booking.task?.location_text && (
        <Text className="text-caption text-text-secondary mb-sm">{booking.task.location_text}</Text>
      )}
      {booking.task?.scheduled_at && (
        <Text className="text-caption text-text-secondary mb-sm">
          {new Date(booking.task.scheduled_at).toLocaleDateString()}
        </Text>
      )}
      {booking.task?.budget && <PriceTag amount={booking.task.budget} size="sm" />}
    </View>
  );
}

export function PaymentNote() {
  const { t } = useTranslation();
  return (
    <View className="mb-xl">
      <Text className="text-caption text-accent italic">{t('customer.bookings.paymentNote')}</Text>
    </View>
  );
}

interface ActionButtonsProps {
  status: string;
  booking: CustomerBooking;
  onTimeline: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onNoShow: () => void;
  onReportIssue: () => void;
  onLeaveReview: () => void;
}

export function ActionButtons({
  status,
  booking,
  onTimeline,
  onReschedule,
  onCancel,
  onNoShow,
  onReportIssue,
  onLeaveReview,
}: ActionButtonsProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-md mb-xl">
      <Touchable
        className="py-sm"
        onPress={onTimeline}
        testID="booking-detail-screen-timeline-link"
      >
        <Text className="text-body text-primary font-medium">
          {t('customer.bookings.ctaTimeline')}
        </Text>
      </Touchable>

      {status === 'ASSIGNED' && (
        <>
          <Touchable
            className="py-sm"
            onPress={onReschedule}
            testID="booking-detail-screen-reschedule-link"
          >
            <Text className="text-body text-primary font-medium">
              {t('customer.bookings.ctaReschedule')}
            </Text>
          </Touchable>
          <Touchable className="py-sm" onPress={onCancel} testID="booking-detail-screen-cancel-btn">
            <Text className="text-body text-danger font-medium">
              {t('customer.bookings.ctaCancel')}
            </Text>
          </Touchable>
        </>
      )}

      {status === 'ASSIGNED' && (
        <Touchable className="py-sm" onPress={onNoShow} testID="booking-detail-screen-no-show-btn">
          <Text className="text-body text-danger font-medium">
            {t('customer.bookings.noShowTitle')}
          </Text>
        </Touchable>
      )}

      {status === 'TASKER_MARKED_DONE' && (
        <Touchable
          className="py-sm"
          onPress={onReportIssue}
          testID="booking-detail-screen-report-issue-link"
        >
          <Text className="text-body text-danger font-medium">
            {t('customer.bookings.ctaReportIssue')}
          </Text>
        </Touchable>
      )}

      {status === 'COMPLETED' && !hasSubmittedReview(booking) && (
        <Touchable
          className="py-sm"
          onPress={onLeaveReview}
          testID="booking-detail-screen-review-link"
        >
          <Text className="text-body text-primary font-medium">{t('shared.review.title')}</Text>
        </Touchable>
      )}

      {(status === 'CANCELLED' || status === 'NO_SHOW') && (
        <Touchable
          className="py-sm"
          onPress={onReportIssue}
          testID="booking-detail-screen-report-issue-link"
        >
          <Text className="text-body text-danger font-medium">
            {t('customer.bookings.ctaReportIssue')}
          </Text>
        </Touchable>
      )}
    </View>
  );
}
