import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Button } from '../../../../components/ui/Button';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { useMarkBookingDone } from '../../../../features/bookings/hooks/useMarkBookingDone';
import { TaskerCancelSheet } from '../../../../features/bookings/components/TaskerCancelSheet';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function BookingDetailTaskerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(bookingId);
  const markDone = useMarkBookingDone();
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
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
    <DetailTemplate testID="SCR-TASK-013"
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
        <View style={styles.content}>
          {/* Status */}
          {status && (
            <View style={styles.section}>
              <StatusBadge status={status} />
            </View>
          )}

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('tasker.jobs.customerLabel', 'Захиалагч')}</Text>
            <Text style={styles.customerName}>{booking.customer?.full_name ?? ''}</Text>
          </View>

          {/* Task Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('tasker.jobs.taskDescription', 'Даалгаврын тайлбар')}
            </Text>
            <Text style={styles.description}>{booking.task?.description ?? ''}</Text>
          </View>

          {(isAssigned || isMarkedDone) && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('tasker.jobs.exactAddress', 'Тодорхой хаяг')}
              </Text>
              <Text style={styles.description}>{booking.task?.location_text ?? ''}</Text>
              <Text style={styles.noteText}>
                {t('tasker.jobs.exactAddressNote', 'Энэ хаяг зөвхөн танд харагдана')}
              </Text>
            </View>
          )}

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('tasker.jobs.schedule', 'Хуваарь')}</Text>
            <Text style={styles.scheduleText}>
              {booking.confirmed_scheduled_at
                ? new Date(booking.confirmed_scheduled_at).toLocaleString()
                : ''}
            </Text>
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('tasker.jobs.budget', 'Төсөв')}</Text>
            <Text style={styles.priceText}>
              {'\u20AE'}
              {booking.price?.toLocaleString() ?? ''}
            </Text>
          </View>

          {/* Payment Note */}
          {isAssigned && (
            <View style={styles.paymentNote}>
              <Text style={styles.sectionLabel}>
                {t('tasker.jobs.paymentNoteHeading', 'Төлбөрийн мэдээлэл')}
              </Text>
              <Text style={styles.paymentNoteText}>
                {t(
                  'tasker.jobs.paymentNote',
                  'Төлбөр нь захиалагчтай шууд тохиролцоно. Tasky нь зуучлагч биш.',
                )}
              </Text>
            </View>
          )}

          {isMarkedDone && (
            <View style={styles.awaitingBanner}>
              <Text style={styles.awaitingText}>
                {t('tasker.jobs.awaitingConfirmation', 'Захиалагч баталгаажуулахыг хүлээж байна')}
              </Text>
            </View>
          )}

          {/* Cancel Button */}
          {isAssigned && (
            <View style={styles.cancelSection}>
              <Button
                label={t('tasker.jobs.cancelBooking', 'Захиалга цуцлах')}
                variant="ghost"
                onPress={() => setCancelSheetOpen(true)}
                textStyle={styles.cancelText}
                testID="booking-detail-tasker-cancel"
              />
            </View>
          )}

          {/* Completed state */}
          {isCompleted && (
            <View style={styles.section}>
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
        </View>
      )}
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.foreground,
  },
  description: {
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: typography.body * 1.375,
  },
  scheduleText: {
    fontSize: typography.body,
    color: colors.foreground,
  },
  priceText: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.secondary,
  },
  paymentNote: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  paymentNoteText: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
    lineHeight: typography.micro * 1.8,
  },
  noteText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
  awaitingBanner: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  awaitingText: {
    fontSize: typography.body,
    color: colors.foreground,
    fontWeight: '600',
  },
  cancelSection: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  cancelText: {
    color: colors.danger,
  },
});
