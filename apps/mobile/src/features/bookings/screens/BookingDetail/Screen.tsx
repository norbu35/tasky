import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { BookingLifecyclePreview } from '@/features/bookings/components/BookingLifecyclePreview';
import { BookingSupportSheet } from '@/features/bookings/components/BookingSupportSheet';
import { ConfirmCompletionSheet } from '@/features/bookings/components/ConfirmCompletionSheet';
import { CustomerCancelSheet } from '@/features/bookings/components/CustomerCancelSheet';

import { ActionButtons } from './ActionToolbar';
import { getCancelType, isReopenedAfterCancellation } from './model';
import { StatusSection } from './StatusHeader';
import { TaskerSection, TaskSummarySection, PaymentNote } from './SummarySections';
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
  } = useBookingDetailScreen();
  const showRecoveryNotice = isReopenedAfterCancellation(booking);

  return (
    <>
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
            <BookingLifecyclePreview
              status={status}
              createdAt={booking.created_at}
              scheduledAt={booking.confirmed_scheduled_at ?? booking.task?.scheduled_at}
            />
            <StatusSection status={status} showRecoveryNotice={showRecoveryNotice} />
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
          </>
        )}
      </DetailTemplate>

      {booking ? (
        <>
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
          <BookingSupportSheet
            isOpen={showSupportSheet}
            onClose={() => setShowSupportSheet(false)}
            onPrimary={handleSupportPrimary}
          />
        </>
      ) : null}
    </>
  );
}
