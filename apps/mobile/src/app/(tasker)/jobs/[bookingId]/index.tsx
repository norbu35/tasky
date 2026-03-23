import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Button } from '../../../../components/ui/Button';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { useMarkBookingDone } from '../../../../features/bookings/hooks/useMarkBookingDone';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function BookingDetailTaskerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(bookingId);
  const markDone = useMarkBookingDone();
  const [_cancelSheetOpen, setCancelSheetOpen] = useState(false);

  const isAssigned = booking?.status === 'ASSIGNED';
  const isCompleted = booking?.status === 'COMPLETED';
  const _isCancelled = booking?.status === 'CANCELLED';
  const _isNoShow = booking?.status === 'NO_SHOW';

  const handleMarkDone = useCallback(() => {
    if (!bookingId) return;
    markDone.mutate({
      bookingId,
      idempotencyKey: `mark-done-${bookingId}-${Date.now()}`,
    });
  }, [bookingId, markDone]);

  const status = booking?.status?.toLowerCase() as
    | 'assigned'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | undefined;

  return (
    <DetailTemplate
      headerTitle={t('tasker.jobs.bookingDetail', 'Booking Detail')}
      onBack={() => router.back()}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      ctaLabel={isAssigned ? t('tasker.jobs.markDone', 'Mark Done') : undefined}
      ctaOnPress={isAssigned ? handleMarkDone : undefined}
      ctaLoading={markDone.isPending}
      testID="booking-detail-tasker"
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
            <Text style={styles.sectionLabel}>{t('tasker.jobs.customerLabel', 'Customer')}</Text>
            <Text style={styles.customerName}>{booking.customer?.full_name ?? ''}</Text>
          </View>

          {/* Task Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('tasker.jobs.taskDescription', 'Task Description')}
            </Text>
            <Text style={styles.description}>{booking.task?.description ?? ''}</Text>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('tasker.jobs.schedule', 'Schedule')}</Text>
            <Text style={styles.scheduleText}>
              {booking.confirmed_scheduled_at
                ? new Date(booking.confirmed_scheduled_at).toLocaleString()
                : ''}
            </Text>
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('tasker.jobs.budget', 'Budget')}</Text>
            <Text style={styles.priceText}>
              {'\u20AE'}
              {booking.price?.toLocaleString() ?? ''}
            </Text>
          </View>

          {/* Payment Note */}
          {isAssigned && (
            <View style={styles.paymentNote}>
              <Text style={styles.paymentNoteText}>
                {t(
                  'tasker.jobs.paymentNote',
                  'Payment is arranged directly with the customer. Tasky is a connector, not a payment processor.',
                )}
              </Text>
            </View>
          )}

          {/* Cancel Button */}
          {isAssigned && (
            <View style={styles.cancelSection}>
              <Button
                label={t('tasker.jobs.cancelBooking', 'Cancel Booking')}
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
                onPress={() => router.push(`/(shared)/review/${booking.id}`)}
                testID="booking-detail-tasker-review"
              />
            </View>
          )}
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
    lineHeight: 22,
  },
  scheduleText: {
    fontSize: typography.body,
    color: colors.foreground,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  paymentNote: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  paymentNoteText: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  cancelSection: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  cancelText: {
    color: colors.danger,
  },
});
