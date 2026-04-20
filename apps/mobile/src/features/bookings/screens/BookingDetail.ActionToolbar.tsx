import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';

import { hasSubmittedReview, type CustomerBooking } from './BookingDetail.model';

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
