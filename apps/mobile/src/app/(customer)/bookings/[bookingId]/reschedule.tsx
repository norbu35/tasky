import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { useReschedule } from '../../../../features/bookings/hooks/useReschedule';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function RescheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { mutateAsync: reschedule, isPending } = useReschedule();

  // Default to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const [selectedDate] = useState<Date>(tomorrow);
  const [reason, setReason] = useState('');

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
    router.back();
  }, [bookingId, selectedDate, reason, reschedule, router]);

  return (
    <FormWizardTemplate
      currentStep={0}
      totalSteps={1}
      onNext={handleSubmit}
      onBack={() => router.back()}
      nextLabel={t('customer.bookings.ctaSubmitReschedule', 'Send Request')}
      nextLoading={isPending}
      showBack={false}
      testID="reschedule-screen"
    >
      {/* Date/Time Picker */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {t('customer.bookings.labelNewSchedule', 'New Schedule')}
        </Text>
        <Pressable
          style={styles.datePicker}
          onPress={handleDatePress}
          testID="reschedule-screen-date-picker"
        >
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString()}{' '}
            {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Pressable>
      </View>

      {/* Reason Field */}
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
  dateText: {
    fontSize: typography.body,
    color: colors.primaryDeep,
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
