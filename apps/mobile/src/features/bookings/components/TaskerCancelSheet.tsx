import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { useCancelBooking } from '../hooks/useCancelBooking';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

interface TaskerCancelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  strikeCount: number;
}

export function TaskerCancelSheet({
  isOpen,
  onClose,
  bookingId,
  strikeCount,
}: TaskerCancelSheetProps) {
  const { t } = useTranslation();
  const cancelBooking = useCancelBooking();

  const hasSuspensionRisk = strikeCount >= 2;

  const handleConfirm = () => {
    cancelBooking.mutate({
      bookingId,
      idempotencyKey: `cancel-${bookingId}-${Date.now()}`,
    });
  };

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('tasker.jobs.cancel.title', 'Cancel Booking')}
      testID="tasker-cancel-sheet"
    >
      {cancelBooking.isPending ? (
        <View style={styles.loadingContainer} testID="cancel-sheet-loading">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            {t('tasker.jobs.cancel.heading', 'Cancel this booking?')}
          </Text>

          <Text style={styles.description}>
            {t(
              'tasker.jobs.cancel.description',
              'Cancelling will reopen the task. Cancellations affect your reliability score.',
            )}
          </Text>

          {strikeCount > 0 && !hasSuspensionRisk && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {t(
                  'tasker.jobs.cancel.strikeWarning',
                  `Warning: You have cancelled ${strikeCount} time(s) in the last 30 days.`,
                )}
              </Text>
              <Text style={styles.strikeCount}>
                {`${strikeCount}/3`}{' '}
                {t('tasker.jobs.cancel.strikeCountLabel', 'cancellations (30 days)')}
              </Text>
            </View>
          )}

          {hasSuspensionRisk && (
            <View style={styles.dangerBox}>
              <Text style={styles.suspensionWarning}>
                {t(
                  'tasker.jobs.cancel.suspensionWarning',
                  'Warning: You have 2 cancellations in 30 days. One more will result in a 7-day suspension!',
                )}
              </Text>
              <Text style={styles.strikeCount}>
                {`${strikeCount}/3`}{' '}
                {t('tasker.jobs.cancel.strikeCountLabel', 'cancellations (30 days)')}
              </Text>
            </View>
          )}

          <Button
            label={t('tasker.jobs.cancel.confirmButton', 'Confirm Cancellation')}
            variant="destructive"
            onPress={handleConfirm}
            testID="cancel-confirm"
          />
          <Button
            label={t('tasker.jobs.cancel.backButton', 'Go Back')}
            variant="outline"
            onPress={onClose}
            testID="cancel-back"
          />
        </View>
      )}
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  heading: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.foreground,
  },
  description: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  dangerBox: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    gap: spacing.xs,
  },
  warningText: {
    fontSize: typography.body,
    color: colors.foreground,
    fontWeight: '500',
  },
  suspensionWarning: {
    fontSize: typography.body,
    color: colors.danger,
    fontWeight: '600',
  },
  strikeCount: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
    fontWeight: '700',
  },
});
