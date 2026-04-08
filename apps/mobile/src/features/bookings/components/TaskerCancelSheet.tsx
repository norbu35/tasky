import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
  onCancelled?: () => void;
}

export function TaskerCancelSheet({
  isOpen,
  onClose,
  bookingId,
  strikeCount,
  onCancelled,
}: TaskerCancelSheetProps) {
  const { t } = useTranslation();
  const cancelBooking = useCancelBooking();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const hasSuspensionRisk = strikeCount >= 2;
  const confirmLabel = hasSuspensionRisk
    ? t('tasker.jobs.cancel.confirmDanger')
    : t('tasker.jobs.cancel.confirmButton');

  const reasons = useMemo(
    () => [
      t('tasker.jobs.cancel.reasonScheduleConflict'),
      t('tasker.jobs.cancel.reasonPersonal'),
      t('tasker.jobs.cancel.reasonEmergency'),
      t('tasker.jobs.cancel.reasonOther'),
    ],
    [t],
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedReason) {
      return;
    }

    await cancelBooking.mutateAsync({
      bookingId,
      idempotencyKey: `cancel-${bookingId}-${Date.now()}`,
    });
    onCancelled?.();
  }, [bookingId, cancelBooking, onCancelled, selectedReason]);

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('tasker.jobs.cancel.title')}
      testID="tasker-cancel-sheet"
    >
      {cancelBooking.isPending ? (
        <View style={styles.loadingContainer} testID="cancel-sheet-loading">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            {t('tasker.jobs.cancel.heading')}
          </Text>

          <Text style={styles.description}>
            {t(
              'tasker.jobs.cancel.description',
              t('TaskerCancelSheet.copy1'),
            )}
          </Text>

          {strikeCount > 0 && !hasSuspensionRisk && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {t(
                  'tasker.jobs.cancel.strikeWarning',
                  `Анхааруулга: Та сүүлийн 30 хоногт ${strikeCount} удаа цуцалсан байна.`,
                )}
              </Text>
              <Text style={styles.strikeCount}>
                {`${strikeCount}/3`}{' '}
                {t('tasker.jobs.cancel.strikeCountLabel')}
              </Text>
            </View>
          )}

          {hasSuspensionRisk && (
            <View style={styles.dangerBox}>
              <Text style={styles.suspensionWarning}>
                {t('TaskerCancelSheet.copy2')}
              </Text>
              <Text style={styles.strikeCount}>
                {`${strikeCount}/3`}{' '}
                {t('tasker.jobs.cancel.strikeCountLabel')}
              </Text>
            </View>
          )}

          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>
              {t('tasker.jobs.cancel.reasonLabel')}
            </Text>
            <View style={styles.reasonList}>
              {reasons.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => setSelectedReason(reason)}
                    style={[styles.reasonChip, isSelected && styles.reasonChipSelected]}
                    testID={`cancel-reason-${reason}`}
                  >
                    <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextSelected]}>
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {!hasSuspensionRisk && strikeCount === 0 && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                {t('TaskerCancelSheet.copy3')}
              </Text>
            </View>
          )}

          <Button
            label={confirmLabel}
            variant="destructive"
            onPress={handleConfirm}
            disabled={!selectedReason}
            testID="cancel-confirm"
          />
          <Button
            label={t('tasker.jobs.cancel.backButton')}
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
  reasonSection: {
    gap: spacing.sm,
  },
  reasonLabel: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  reasonChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  reasonChipText: {
    fontSize: typography.body,
    color: colors.foreground,
  },
  reasonChipTextSelected: {
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  noteBox: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
    lineHeight: 18,
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
