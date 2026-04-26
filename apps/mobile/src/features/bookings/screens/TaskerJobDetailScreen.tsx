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

import { TaskerJobDetailActions } from './TaskerJobDetail.Actions';

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
        isAssigned || isMarkedDone ? () => router.push(`/inbox/${bookingId}`) : undefined
      }
    >
      {booking && (
        <View className="gap-lg">
          {/* Status */}
          {status && (
            <View className="gap-xs">
              <StatusBadge status={status} />
            </View>
          )}

          <BookingLifecyclePreview
            status={bookingStatus}
            createdAt={booking.created_at}
            scheduledAt={booking.confirmed_scheduled_at ?? booking.task?.scheduled_at}
          />

          {/* Customer Info */}
          <View className="gap-xs">
            <Text className="text-micro font-sans-bold text-muted-foreground uppercase tracking-[0.5px]">
              {t('tasker.jobs.customerLabel')}
            </Text>
            <Text className="text-subtitle font-semibold text-foreground">
              {booking.customer?.full_name ?? ''}
            </Text>
          </View>

          {/* Task Description */}
          <View className="gap-xs">
            <Text className="text-micro font-sans-bold text-muted-foreground uppercase tracking-[0.5px]">
              {t('tasker.jobs.taskDescription')}
            </Text>
            <Text className="text-body text-foreground leading-[22px]">
              {booking.task?.description ?? ''}
            </Text>
          </View>

          {(isAssigned || isMarkedDone) && (
            <View className="gap-xs">
              <Text className="text-micro font-sans-bold text-muted-foreground uppercase tracking-[0.5px]">
                {t('tasker.jobs.exactAddress')}
              </Text>
              <Text className="text-body text-foreground leading-[22px]">
                {booking.task?.location_text ?? ''}
              </Text>
              <Text className="text-caption text-text-secondary leading-[20px]">
                {t('tasker.jobs.exactAddressNote')}
              </Text>
            </View>
          )}

          {/* Schedule */}
          <View className="gap-xs">
            <Text className="text-micro font-sans-bold text-muted-foreground uppercase tracking-[0.5px]">
              {t('tasker.jobs.schedule')}
            </Text>
            <Text className="text-body text-foreground">
              {booking.confirmed_scheduled_at
                ? new Date(booking.confirmed_scheduled_at).toLocaleString()
                : ''}
            </Text>
          </View>

          {/* Budget */}
          <View className="gap-xs">
            <Text className="text-micro font-sans-bold text-muted-foreground uppercase tracking-[0.5px]">
              {t('tasker.jobs.budget')}
            </Text>
            <Text className="text-heading font-sans-bold text-secondary">
              {'\u20AE'}
              {booking.price?.toLocaleString() ?? ''}
            </Text>
          </View>

          {/* Payment Note */}
          {isAssigned && (
            <View className="bg-muted rounded-md p-md">
              <Text className="text-micro font-sans-bold text-muted-foreground uppercase tracking-[0.5px] mb-xs">
                {t('tasker.jobs.paymentNoteHeading')}
              </Text>
              <Text className="text-micro text-muted-foreground leading-[20px]">
                {t('BookingDetailTaskerScreen.copy1')}
              </Text>
            </View>
          )}

          {isMarkedDone && (
            <View className="bg-muted rounded-md p-md">
              <Text className="text-body text-foreground font-semibold">
                {t('tasker.jobs.awaitingConfirmation')}
              </Text>
            </View>
          )}

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

          {cancelSheetOpen ? (
            <TaskerCancelSheet
              isOpen={cancelSheetOpen}
              onClose={() => setCancelSheetOpen(false)}
              bookingId={booking.id}
              strikeCount={0}
              onCancelled={() => {
                setCancelSheetOpen(false);
                router.replace('/(tasker)/jobs');
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
              router.push(`/inbox/${bookingId}`);
            }}
          />
        </View>
      )}
    </DetailTemplate>
  );
}
