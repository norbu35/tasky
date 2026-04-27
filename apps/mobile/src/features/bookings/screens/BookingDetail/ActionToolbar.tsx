import { AlertTriangle, CalendarClock, Clock, Flag, RotateCcw, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ActionRow } from '@/components/ui/ActionRow';
import { mobileTheme } from '@/design/tokenAdapter';

import { hasSubmittedReview, type CustomerBooking } from './model';

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
  const { colors } = mobileTheme;
  return (
    <View className="mb-xl rounded-md border border-border overflow-hidden">
      <ActionRow
        icon={<Clock size={20} color={colors.primary} />}
        label={t('customer.bookings.ctaTimeline')}
        onPress={onTimeline}
        testID="booking-detail-screen-timeline-link"
      />

      {status === 'ASSIGNED' && (
        <>
          <ActionRow
            icon={<CalendarClock size={20} color={colors.primary} />}
            label={t('customer.bookings.ctaReschedule')}
            onPress={onReschedule}
            testID="booking-detail-screen-reschedule-link"
          />
          <ActionRow
            icon={<AlertTriangle size={20} color={colors.danger} />}
            label={t('customer.bookings.ctaCancel')}
            onPress={onCancel}
            testID="booking-detail-screen-cancel-btn"
            destructive
          />
        </>
      )}

      {status === 'ASSIGNED' && (
        <ActionRow
          icon={<Flag size={20} color={colors.danger} />}
          label={t('customer.bookings.noShowTitle')}
          onPress={onNoShow}
          testID="booking-detail-screen-no-show-btn"
          destructive
        />
      )}

      {status === 'TASKER_MARKED_DONE' && (
        <ActionRow
          icon={<Flag size={20} color={colors.danger} />}
          label={t('customer.bookings.ctaReportIssue')}
          onPress={onReportIssue}
          testID="booking-detail-screen-report-issue-link"
          destructive
        />
      )}

      {status === 'COMPLETED' && !hasSubmittedReview(booking) && (
        <ActionRow
          icon={<Star size={20} color={colors.primary} />}
          label={t('shared.review.title')}
          onPress={onLeaveReview}
          testID="booking-detail-screen-review-link"
        />
      )}

      {(status === 'CANCELLED' || status === 'NO_SHOW') && (
        <ActionRow
          icon={<RotateCcw size={20} color={colors.danger} />}
          label={t('customer.bookings.ctaReportIssue')}
          onPress={onReportIssue}
          testID="booking-detail-screen-report-issue-link"
          showDivider={false}
          destructive
        />
      )}
    </View>
  );
}
