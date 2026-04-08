import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { useCancelBooking } from '../hooks/useCancelBooking';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;
const dangerTint = `${colors.danger}1a`;

export type CancelType = 'free_cancel' | 'late_cancel_warning' | 'late_cancel_incident_count';

interface CustomerCancelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  cancelType: CancelType;
  onCancelled?: () => void;
}

function ReasonRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.reasonRow} accessibilityRole="button">
      <Text style={styles.reasonLabel}>{label}</Text>
      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
        {active ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
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
  const cancelReasons = [
    { id: 'no_tasker', label: t('CustomerCancelSheet.reasonNoTasker') },
    { id: 'schedule', label: t('CustomerCancelSheet.reasonSchedule') },
    { id: 'other', label: t('CustomerCancelSheet.reasonOther') },
  ] as const;
  const [selectedReason, setSelectedReason] =
    React.useState<(typeof cancelReasons)[number]['id']>('other');
  const [details, setDetails] = React.useState('');

  const handleCancel = useCallback(async () => {
    const idempotencyKey = `cancel-${bookingId}-${Date.now()}`;
    await cancelBooking({ bookingId, idempotencyKey });
    onCancelled?.();
    onClose();
  }, [bookingId, cancelBooking, onCancelled, onClose]);

  const warningText =
    cancelType === 'free_cancel'
      ? t('CustomerCancelSheet.copy1')
      : cancelType === 'late_cancel_incident_count'
        ? t('CustomerCancelSheet.copy2')
        : t('CustomerCancelSheet.copy3');

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      testID="customer-cancel-sheet"
      snapPoints={['88%']}
    >
      <View style={styles.iconWrap}>
        <View style={styles.iconOuter}>
          <AlertTriangle size={28} color={colors.danger} />
        </View>
      </View>

      <Text style={styles.title}>{t('customer.bookings.cancelQuestion')}</Text>
      <Text style={styles.subtitle}>{t('customer.bookings.cancelPrompt')}</Text>

      <View style={styles.warningCard}>
        <Text style={styles.warningText}>{warningText}</Text>
      </View>

      <View style={styles.reasonList}>
        {cancelReasons.map((reason) => (
          <ReasonRow
            key={reason.id}
            label={reason.label}
            active={selectedReason === reason.id}
            onPress={() => setSelectedReason(reason.id)}
          />
        ))}
      </View>

      <View style={styles.textAreaCard}>
        <TextInput
          style={styles.textArea}
          placeholder={t('customer.bookings.cancelDetailsPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={4}
          maxLength={240}
          testID="customer-cancel-details"
        />
      </View>

      <View style={styles.policyNote}>
        <Text style={styles.policyNoteText}>{t('CustomerCancelSheet.copy4')}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={t('customer.bookings.ctaCancelConfirm')}
          variant="destructive"
          onPress={() => void handleCancel()}
          isLoading={isPending}
          testID="cancel-confirm-btn"
          style={styles.primaryButton}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={styles.secondaryButton}
          testID="cancel-go-back-btn"
        >
          <Text style={styles.secondaryButtonText}>{t('customer.bookings.ctaGoBack')}</Text>
        </Pressable>
      </View>
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  iconOuter: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: dangerTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  warningCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: {
    fontSize: typography.label,
    lineHeight: typography.label * 1.5,
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  reasonLabel: {
    flex: 1,
    fontSize: typography.body,
    color: colors.primaryDeep,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  radioOuterActive: {
    borderColor: colors.primaryDeep,
    backgroundColor: colors.primaryDeep,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryForeground,
  },
  textAreaCard: {
    minHeight: 100,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  textArea: {
    minHeight: 80,
    fontSize: typography.body,
    color: colors.primaryDeep,
    textAlignVertical: 'top',
  },
  policyNote: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  policyNoteText: {
    fontSize: typography.caption,
    lineHeight: typography.caption * 1.5,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    alignSelf: 'stretch',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primaryDeep,
  },
  secondaryButtonText: {
    fontSize: typography.body,
    color: colors.primaryDeep,
    fontWeight: '700',
  },
});
