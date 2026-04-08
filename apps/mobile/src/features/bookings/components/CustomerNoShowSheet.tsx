import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { useFlagNoShow } from '../hooks/useFlagNoShow';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export type NoShowState = 'reminder_10min' | 'flag_available_15min' | 'flagging' | 'flagged';

interface CustomerNoShowSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  state: NoShowState;
  onFlagged?: () => void;
}

export function CustomerNoShowSheet({
  isOpen,
  onClose,
  bookingId,
  state,
  onFlagged,
}: CustomerNoShowSheetProps) {
  const { t } = useTranslation();
  const { mutateAsync: flagNoShow, isPending } = useFlagNoShow();

  const handleFlag = useCallback(async () => {
    await flagNoShow({ bookingId });
    onFlagged?.();
    onClose();
  }, [bookingId, flagNoShow, onClose, onFlagged]);

  const handleArrived = useCallback(() => {
    onClose();
  }, [onClose]);

  if (state === 'flagged') {
    return (
      <ModalSheetTemplate isOpen={isOpen} onClose={onClose} testID="customer-no-show-sheet">
        <Text style={styles.successText}>
          {t('customer.bookings.noShowFlaggedSuccess')}
        </Text>
      </ModalSheetTemplate>
    );
  }

  if (state === 'reminder_10min') {
    return (
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={onClose}
        title={t('customer.bookings.noShowReminderTitle')}
        testID="customer-no-show-sheet"
      >
        <Text style={styles.description}>
          {t('CustomerNoShowSheet.copy1')}
        </Text>
        <Button
          label={t('customer.bookings.ctaTaskerArrived')}
          onPress={handleArrived}
          testID="no-show-arrived-btn"
        />
        <Button
          label={t('customer.bookings.ctaNotYet')}
          variant="outline"
          onPress={onClose}
          testID="no-show-not-yet-btn"
        />
      </ModalSheetTemplate>
    );
  }

  // flag_available_15min or flagging
  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.bookings.noShowFlagTitle')}
      testID="customer-no-show-sheet"
    >
      <Text style={styles.description}>
        {t('CustomerNoShowSheet.copy2')}
      </Text>
      <Button
        label={t('customer.bookings.ctaFlagNoShow')}
        variant="destructive"
        onPress={handleFlag}
        isLoading={isPending || state === 'flagging'}
        testID="no-show-flag-btn"
      />
      <Button
        label={t('customer.bookings.ctaDismiss')}
        variant="outline"
        onPress={onClose}
        testID="no-show-dismiss-btn"
      />
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          {t('CustomerNoShowSheet.copy3')}
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
  successText: {
    fontSize: typography.body,
    color: colors.trust,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: spacing.lg,
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
