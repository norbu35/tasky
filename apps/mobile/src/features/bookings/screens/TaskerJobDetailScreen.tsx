import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BookingLifecyclePreview } from '@/features/bookings/components/BookingLifecyclePreview';
import { BookingSupportSheet } from '@/features/bookings/components/BookingSupportSheet';
import { TaskerCancelSheet } from '@/features/bookings/components/TaskerCancelSheet';
import { useBookingDetail } from '@/features/bookings/hooks/useBookingDetail';
import { useFlagNoShow } from '@/features/bookings/hooks/useFlagNoShow';
import { useMarkBookingDone } from '@/features/bookings/hooks/useMarkBookingDone';
import { useConversationRouteForBooking } from '@/features/chat';

import { TaskerJobDetailActions } from './TaskerJobDetail.Actions';
import { TaskerJobDetailSections } from './TaskerJobDetail.Sections';

function getStatusHeading(status: string | undefined, t: (key: string) => string): string {
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
      return t('tasker.jobs.bookingDetail');
  }
}

export default function TaskerJobDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(bookingId);
  const markDone = useMarkBookingDone();
  const flagNoShow = useFlagNoShow();
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [showNoShowSheet, setShowNoShowSheet] = useState(false);
  const [supportSheetOpen, setSupportSheetOpen] = useState(false);
  const bookingStatus = booking?.status as string | undefined;
  const { route: conversationRoute } = useConversationRouteForBooking({
    taskId: booking?.task_id ?? booking?.task?.id,
    counterpartyId: booking?.customer_id ?? booking?.customer?.id,
  });

  const isAssigned = bookingStatus === 'ASSIGNED';
  const isMarkedDone = bookingStatus === 'TASKER_MARKED_DONE';
  const isCompleted = bookingStatus === 'COMPLETED';
  const handleMarkDone = useCallback(() => {
    if (!bookingId) return;
    markDone.mutate({
      bookingId,
      idempotencyKey: `mark-done-${bookingId}-${Date.now()}`,
    });
  }, [bookingId, markDone]);

  const status = (
    bookingStatus === 'TASKER_MARKED_DONE' ? 'assigned' : bookingStatus?.toLowerCase()
  ) as 'assigned' | 'completed' | 'cancelled' | 'no_show' | undefined;

  return (
    <>
      <DetailTemplate
        testID="SCR-TASK-013"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        ctaLabel={isAssigned ? t('tasker.jobs.markDone') : undefined}
        ctaOnPress={isAssigned ? handleMarkDone : undefined}
        ctaLoading={markDone.isPending}
        secondaryCtaLabel={isAssigned || isMarkedDone ? t('tasker.jobs.messageButton') : undefined}
        secondaryCtaOnPress={
          isAssigned || isMarkedDone ? () => router.push(conversationRoute) : undefined
        }
      >
        {booking && (
          <>
            <BookingLifecyclePreview
              status={bookingStatus}
              createdAt={booking.created_at}
              scheduledAt={booking.confirmed_scheduled_at ?? booking.task?.scheduled_at}
            />

            {status && (
              <View
                className="border-b border-border pb-lg mb-lg"
                testID="tasker-job-detail-status-section"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 pr-md">
                    <Text className="text-caption text-text-secondary mb-xs">
                      {t('tasker.jobs.bookingDetail')}
                    </Text>
                    <Text className="text-heading font-display-bold text-primary-deep">
                      {getStatusHeading(bookingStatus, t)}
                    </Text>
                  </View>
                  <StatusBadge status={status} />
                </View>
                {isMarkedDone ? (
                  <View className="mt-md rounded-md border border-border bg-muted p-md">
                    <Text className="text-body font-semibold text-primary-deep">
                      {t('tasker.jobs.awaitingConfirmation')}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            <TaskerJobDetailSections
              booking={booking}
              showExactAddress={isAssigned || isMarkedDone}
            />

            <TaskerJobDetailActions
              isAssigned={isAssigned}
              isCompleted={isCompleted}
              onOpenSupport={() => setSupportSheetOpen(true)}
              onOpenNoShow={() => setShowNoShowSheet(true)}
              onOpenCancel={() => setCancelSheetOpen(true)}
              onLeaveReview={() =>
                router.push({
                  pathname: '/(shared)/review/[bookingId]',
                  params: { bookingId: booking.id, role: 'tasker' },
                })
              }
            />
          </>
        )}
      </DetailTemplate>

      {booking ? (
        <>
          {cancelSheetOpen ? (
            <TaskerCancelSheet
              isOpen={cancelSheetOpen}
              onClose={() => setCancelSheetOpen(false)}
              bookingId={booking.id}
              strikeCount={0}
              onCancelled={() => {
                setCancelSheetOpen(false);
                router.replace('/(tabs)/bookings');
              }}
            />
          ) : null}
          <ConfirmSheet
            testID="SCR-TASK-014"
            isOpen={showNoShowSheet}
            onClose={() => setShowNoShowSheet(false)}
            title={t('tasker.jobs.noShow.title')}
            description={t('BookingDetailTaskerScreen.copy2')}
            confirmLabel={t('tasker.jobs.noShow.flagButton')}
            onConfirm={() => {
              if (!bookingId) return;
              flagNoShow.mutate(
                { bookingId },
                {
                  onSuccess: () => {
                    setShowNoShowSheet(false);
                    refetch();
                  },
                  onError: () => {
                    Alert.alert(t('common.error'), t('tasker.jobs.noShowError'));
                  },
                },
              );
            }}
            isDestructive
          />
          <BookingSupportSheet
            isOpen={supportSheetOpen}
            onClose={() => setSupportSheetOpen(false)}
            onPrimary={() => {
              setSupportSheetOpen(false);
              router.push(conversationRoute);
            }}
          />
        </>
      ) : null}
    </>
  );
}
