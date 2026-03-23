import React, { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { useCompleteBooking } from '../hooks/useCompleteBooking';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

interface ConfirmCompletionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onCompleted?: () => void;
}

export function ConfirmCompletionSheet({
  isOpen,
  onClose,
  bookingId,
  onCompleted,
}: ConfirmCompletionSheetProps) {
  const { t } = useTranslation();
  const { mutateAsync: completeBooking, isPending } = useCompleteBooking();

  const handleConfirm = useCallback(async () => {
    const idempotencyKey = `complete-${bookingId}-${Date.now()}`;
    await completeBooking({ bookingId, idempotencyKey });
    onCompleted?.();
  }, [bookingId, completeBooking, onCompleted]);

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.bookings.confirmCompletionTitle', 'Confirm the work is complete?')}
      testID="confirm-completion-sheet"
    >
      <Text style={styles.description}>
        {t(
          'customer.bookings.confirmCompletionDescription',
          'After confirming, you can leave a review. Payment is settled directly with the Tasker.',
        )}
      </Text>
      <Button
        label={t('customer.bookings.ctaConfirmComplete', 'Confirm Complete')}
        onPress={handleConfirm}
        isLoading={isPending}
        testID="confirm-completion-confirm-btn"
      />
      <Button
        label={t('customer.bookings.ctaGoBack', 'Go Back')}
        variant="outline"
        onPress={onClose}
        testID="confirm-completion-cancel-btn"
      />
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
});
