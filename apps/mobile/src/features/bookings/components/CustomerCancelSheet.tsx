import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { useCancelBooking } from '../hooks/useCancelBooking';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export type CancelType = 'free_cancel' | 'late_cancel_warning';

interface CustomerCancelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  cancelType: CancelType;
  onCancelled?: () => void;
}

export function CustomerCancelSheet({
  isOpen,
  onClose,
  bookingId,
  cancelType,
  onCancelled,
}: CustomerCancelSheetProps) {
  const { t } = useTranslation();
  const { mutateAsync: cancelBooking, isPending } = useCancelBooking();

  const handleCancel = useCallback(async () => {
    const idempotencyKey = `cancel-${bookingId}-${Date.now()}`;
    await cancelBooking({ bookingId, idempotencyKey });
    onCancelled?.();
  }, [bookingId, cancelBooking, onCancelled]);

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.bookings.cancelTitle', 'Cancel Booking')}
      testID="customer-cancel-sheet"
    >
      <Text style={styles.description}>
        {cancelType === 'free_cancel'
          ? t(
              'customer.bookings.freeCancelDescription',
              'You can cancel this booking with no penalty.',
            )
          : t(
              'customer.bookings.lateCancelDescription',
              'Less than 4 hours until scheduled time. This cancellation will be recorded as a reliability incident.',
            )}
      </Text>
      <Button
        label={t('customer.bookings.ctaCancelConfirm', 'Cancel Booking')}
        variant="destructive"
        onPress={handleCancel}
        isLoading={isPending}
        testID="cancel-confirm-btn"
      />
      <Button
        label={t('customer.bookings.ctaGoBack', 'Go Back')}
        variant="outline"
        onPress={onClose}
        testID="cancel-go-back-btn"
      />
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          {t(
            'customer.bookings.cancelPolicyNote',
            'Cancellation policy: >4 hours before — no penalty. Within 4 hours — reliability incident.',
          )}
        </Text>
      </View>
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: typography.body,
    color: colors.accent,
    lineHeight: typography.body * 1.6,
    marginBottom: spacing.md,
  },
  noteContainer: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
});
