import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { ConfirmCompletionSheet } from '@/features/bookings/components/ConfirmCompletionSheet';
import { CustomerCancelSheet } from '@/features/bookings/components/CustomerCancelSheet';

import { getCancelType } from './BookingDetail.model';
import {
  StatusSection,
  TaskerSection,
  TaskSummarySection,
  PaymentNote,
  ActionButtons,
} from './BookingDetail.parts';
import { useBookingDetailScreen } from './useBookingDetailScreen';

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const {
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
  } = useBookingDetailScreen();

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
          <StatusSection status={status} />
          <TaskerSection booking={booking} onTaskerPress={handleTaskerPress} />
          <TaskSummarySection booking={booking} />
          <PaymentNote />
          <ActionButtons
            status={status}
            booking={booking}
            onTimeline={handleTimeline}
            onReschedule={handleReschedule}
            onCancel={() => setShowCancelSheet(true)}
            onNoShow={() => setShowNoShowSheet(true)}
            onReportIssue={handleReportIssue}
            onLeaveReview={handleLeaveReview}
          />
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
            onCancelled={handleCancelConfirmed}
          />
          <ConfirmSheet
            testID="SCR-CUST-021"
            isOpen={showNoShowSheet}
            onClose={() => setShowNoShowSheet(false)}
            title={t('customer.bookings.noShowTitle')}
            description={t('BookingDetailScreen.copy2')}
            confirmLabel={t('customer.bookings.noShowFlag')}
            onConfirm={handleFlagNoShow}
            isDestructive
          />
        </>
      )}
    </DetailTemplate>
  );
}
