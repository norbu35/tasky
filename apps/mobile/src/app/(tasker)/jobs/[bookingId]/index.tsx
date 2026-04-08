import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Button } from '../../../../components/ui/Button';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { useMarkBookingDone } from '../../../../features/bookings/hooks/useMarkBookingDone';
import { TaskerCancelSheet } from '../../../../features/bookings/components/TaskerCancelSheet';
import { ConfirmSheet } from '../../../../components/ui/ConfirmSheet';

export default function BookingDetailTaskerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(bookingId);
  const markDone = useMarkBookingDone();
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [showNoShowSheet, setShowNoShowSheet] = useState(false);
  const bookingStatus = booking?.status as string | undefined;

  const isAssigned = bookingStatus === 'ASSIGNED';
  const isMarkedDone = bookingStatus === 'TASKER_MARKED_DONE';
  const isCompleted = bookingStatus === 'COMPLETED';
  const _isCancelled = bookingStatus === 'CANCELLED';
  const _isNoShow = bookingStatus === 'NO_SHOW';

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
      ctaLabel={isAssigned ? t('tasker.jobs.markDone', 'Ажил дууссан') : undefined}
      ctaOnPress={isAssigned ? handleMarkDone : undefined}
      ctaLoading={markDone.isPending}
      secondaryCtaLabel={
        isAssigned || isMarkedDone ? t('tasker.jobs.messageButton', 'Зурвас илгээх') : undefined
      }
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

          {/* Customer Info */}
          <View className="gap-xs">
            <Text className="text-micro font-sans-bold text-mutedForeground uppercase tracking-[0.5px]">
              {t('tasker.jobs.customerLabel', 'Захиалагч')}
            </Text>
            <Text className="text-subtitle font-semibold text-foreground">
              {booking.customer?.full_name ?? ''}
            </Text>
          </View>

          {/* Task Description */}
          <View className="gap-xs">
            <Text className="text-micro font-sans-bold text-mutedForeground uppercase tracking-[0.5px]">
              {t('tasker.jobs.taskDescription', 'Даалгаврын тайлбар')}
            </Text>
            <Text className="text-body text-foreground leading-[22px]">
              {booking.task?.description ?? ''}
            </Text>
          </View>

          {(isAssigned || isMarkedDone) && (
            <View className="gap-xs">
              <Text className="text-micro font-sans-bold text-mutedForeground uppercase tracking-[0.5px]">
                {t('tasker.jobs.exactAddress', 'Тодорхой хаяг')}
              </Text>
              <Text className="text-body text-foreground leading-[22px]">
                {booking.task?.location_text ?? ''}
              </Text>
              <Text className="text-caption text-textSecondary leading-[20px]">
                {t('tasker.jobs.exactAddressNote', 'Энэ хаяг зөвхөн танд харагдана')}
              </Text>
            </View>
          )}

          {/* Schedule */}
          <View className="gap-xs">
            <Text className="text-micro font-sans-bold text-mutedForeground uppercase tracking-[0.5px]">
              {t('tasker.jobs.schedule', 'Хуваарь')}
            </Text>
            <Text className="text-body text-foreground">
              {booking.confirmed_scheduled_at
                ? new Date(booking.confirmed_scheduled_at).toLocaleString()
                : ''}
            </Text>
          </View>

          {/* Budget */}
          <View className="gap-xs">
            <Text className="text-micro font-sans-bold text-mutedForeground uppercase tracking-[0.5px]">
              {t('tasker.jobs.budget', 'Төсөв')}
            </Text>
            <Text className="text-heading font-sans-bold text-secondary">
              {'\u20AE'}
              {booking.price?.toLocaleString() ?? ''}
            </Text>
          </View>

          {/* Payment Note */}
          {isAssigned && (
            <View className="bg-muted rounded-md p-md">
              <Text className="text-micro font-sans-bold text-mutedForeground uppercase tracking-[0.5px] mb-xs">
                {t('tasker.jobs.paymentNoteHeading', 'Төлбөрийн мэдээлэл')}
              </Text>
              <Text className="text-micro text-mutedForeground leading-[20px]">
                {t(
                  'tasker.jobs.paymentNote',
                  'Төлбөр нь захиалагчтай шууд тохиролцоно. Tasky нь зуучлагч биш.',
                )}
              </Text>
            </View>
          )}

          {isMarkedDone && (
            <View className="bg-muted rounded-md p-md">
              <Text className="text-body text-foreground font-semibold">
                {t('tasker.jobs.awaitingConfirmation', 'Захиалагч баталгаажуулахыг хүлээж байна')}
              </Text>
            </View>
          )}

          {/* Cancel Button */}
          {isAssigned && (
            <View className="items-center pt-md">
              <Button
                label={t('tasker.jobs.cancelBooking', 'Захиалга цуцлах')}
                variant="ghost"
                onPress={() => setCancelSheetOpen(true)}
                labelClassName="text-danger"
                testID="booking-detail-tasker-cancel"
              />
            </View>
          )}

          {/* Completed state */}
          {isCompleted && (
            <View className="gap-xs">
              <Button
                label={t('tasker.jobs.leaveReview', 'Leave Review')}
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: '/(shared)/review/[bookingId]',
                    params: { bookingId: booking.id, role: 'tasker' },
                  })
                }
                testID="booking-detail-tasker-review"
              />
            </View>
          )}

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
            title={t('tasker.noShow.title', 'Report Customer No-Show')}
            description={t(
              'tasker.noShow.description',
              'Report that the customer was not present. Only use after waiting 15+ minutes.',
            )}
            confirmLabel={t('tasker.noShow.confirm', 'Report No-Show')}
            onConfirm={() => {
              // TODO: wire real no-show API
              setShowNoShowSheet(false);
            }}
            isDestructive
          />
        </View>
      )}
    </DetailTemplate>
  );
}
