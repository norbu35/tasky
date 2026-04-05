import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';
import { useCancelBooking } from '../../bookings/hooks/useCancelBooking';
import { generateIdempotencyKey } from '../../../utils/uuid';

const { colors, spacing, typography, radius } = mobileTheme;

export interface TaskCancelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskStatus: string;
  bookingId?: string;
  isLateCancellation?: boolean;
}

export function TaskCancelSheet({
  isOpen,
  onClose,
  taskId: _taskId,
  taskStatus,
  bookingId,
  isLateCancellation = false,
}: TaskCancelSheetProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const cancelBooking = useCancelBooking();

  const isAssigned = taskStatus === 'ASSIGNED';
  const isLate = isAssigned && isLateCancellation;
  const title = isLate
    ? t('customer.cancelSheet.titleLate', 'Late Cancellation')
    : isAssigned
      ? t('customer.cancelSheet.titleAssigned', 'Cancel this booking?')
      : t('customer.cancelSheet.titleOpen', 'Cancel this task?');

  const body = isLate
    ? t(
        'customer.cancelSheet.bodyLate',
        'Cancelling within 4 hours of schedule. This will be recorded as a reliability incident',
      )
    : isAssigned
      ? t(
          'customer.cancelSheet.bodyAssigned',
          'Cancelling more than 4 hours before schedule incurs no penalty',
        )
      : t('customer.cancelSheet.bodyOpen', 'Cancelling this task has no penalty');

  const handleConfirmCancel = async () => {
    try {
      if (bookingId) {
        await cancelBooking.mutateAsync({
          bookingId,
          idempotencyKey: generateIdempotencyKey(),
        });
      }
      onClose();
      router.replace('/(tabs)');
    } catch {
      // Error state is handled by the mutation hook and toast layer.
    }
  };

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      testID="task-cancel-sheet"
      snapPoints={['45%']}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <AlertTriangle size={22} color={colors.danger} />
        </View>
        <Text style={styles.body}>{body}</Text>

        {isLate ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {t(
                'customer.cancelSheet.lateWarningDetail',
                '2 late cancellations within 28 days will affect your ranking',
              )}
            </Text>
          </View>
        ) : null}

        <Button
          label={t('customer.cancelSheet.confirm', 'Yes, Cancel')}
          variant="destructive"
          onPress={handleConfirmCancel}
          isLoading={cancelBooking.isPending}
          testID="task-cancel-confirm"
        />

        <Pressable onPress={onClose} style={styles.goBackButton}>
          <Text style={styles.goBackText}>{t('customer.cancelSheet.goBack', 'Go Back')}</Text>
        </Pressable>
      </View>
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.danger}14`,
  },
  body: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    lineHeight: typography.body * 1.6,
  },
  warningBox: {
    backgroundColor: `${colors.danger}15`,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  warningText: {
    fontSize: typography.label,
    color: colors.danger,
    lineHeight: typography.label * 1.5,
  },
  goBackButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  goBackText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
