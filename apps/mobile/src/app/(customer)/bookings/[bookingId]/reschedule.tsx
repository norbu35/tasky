import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { useReschedule } from '../../../../features/bookings/hooks/useReschedule';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type RescheduleState = 'request_form' | 'awaiting_response';

function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

export default function RescheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { mutateAsync: reschedule, isPending } = useReschedule();
  const { data: booking } = useBookingDetail(bookingId);

  // Default to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const [selectedDate] = useState<Date>(tomorrow);
  const [reason, setReason] = useState('');
  const [requestState, setRequestState] = useState<RescheduleState>('request_form');

  const handleDatePress = useCallback(() => {
    // In production, this would open a DateTimePicker
    // For now, the date is pre-set to tomorrow
  }, []);

  const handleSubmit = useCallback(async () => {
    const idempotencyKey = `reschedule-${bookingId}-${Date.now()}`;
    await reschedule({
      bookingId,
      proposed_scheduled_at: selectedDate.toISOString(),
      reason: reason || undefined,
      idempotencyKey,
    });
    setRequestState('awaiting_response');
  }, [bookingId, selectedDate, reason, reschedule, router]);

  return (
    <FormWizardTemplate
      currentStep={0}
      totalSteps={1}
      onNext={handleSubmit}
      onBack={() => router.back()}
      nextLabel={t('customer.bookings.ctaSubmitReschedule', 'Send Request')}
      nextLoading={isPending}
      showBack
      testID="reschedule-screen"
    >
      {requestState === 'request_form' ? (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {t('customer.bookings.sectionCurrentSchedule', 'Current Schedule')}
            </Text>
            <View style={styles.currentScheduleCard}>
              <Text style={styles.currentScheduleText}>
                {booking?.task?.scheduled_at
                  ? formatDateTime(booking.task.scheduled_at)
                  : t('customer.bookings.scheduleUnavailable', 'Schedule unavailable')}
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {t('customer.bookings.labelNewSchedule', 'New Schedule')}
            </Text>
            <Pressable
              style={styles.datePicker}
              onPress={handleDatePress}
              testID="reschedule-screen-date-picker"
            >
              <Text style={styles.dateText}>{formatDateTime(selectedDate)}</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('customer.bookings.labelReason', 'Reason')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('customer.bookings.placeholderReason', 'Reason for rescheduling...')}
              placeholderTextColor={colors.textTertiary}
              value={reason}
              onChangeText={setReason}
              maxLength={200}
              multiline
              numberOfLines={3}
              testID="reschedule-screen-reason"
            />
            <Text style={styles.helperText}>{t('customer.bookings.helperReason', 'Optional')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.stateCard}>
          <Text style={styles.awaitingBadge}>
            {t('customer.bookings.statusAwaiting', 'Awaiting Response')}
          </Text>
          <Text style={styles.stateMessage}>
            {t(
              'customer.bookings.scheduleAuthorityNote',
              'Schedule changes take effect only after counterparty acceptance',
            )}
          </Text>
        </View>
      )}

      {/* Schedule Authority Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          {t(
            'customer.bookings.scheduleAuthorityNote',
            'Schedule changes take effect only after counterparty acceptance',
          )}
        </Text>
      </View>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  datePicker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  currentScheduleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  currentScheduleText: {
    fontSize: typography.body,
    color: colors.primaryDeep,
  },
  dateText: {
    fontSize: typography.body,
    color: colors.primaryDeep,
  },
  stateCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  awaitingBadge: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stateMessage: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.primaryDeep,
    backgroundColor: colors.card,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  noteContainer: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
});
