import { AlertTriangle } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme, withAlpha } from '@/design/tokenAdapter';

import { useCancelBooking } from '../hooks/useCancelBooking';

const { colors, typography } = mobileTheme;
const dangerTint = withAlpha(colors.danger, 0.1);

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
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between bg-muted rounded-md px-md py-md"
      accessibilityRole="button"
    >
      <Text className="flex-1 text-body text-primary-deep">{label}</Text>
      <View
        className={`w-[22] h-[22] rounded-full border items-center justify-center${
          active ? ' border-primary-deep bg-primary-deep' : ' border-border bg-card'
        }`}
      >
        {active ? <View className="w-2 h-2 rounded-full bg-primary-foreground" /> : null}
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
      <View className="items-center mt-sm mb-md">
        <View
          className="w-[64] h-[64] rounded-lg items-center justify-center"
          style={{ backgroundColor: dangerTint }}
        >
          <AlertTriangle size={24} color={colors.danger} />
        </View>
      </View>

      <Text className="text-title font-bold text-primary-deep text-center">
        {t('customer.bookings.cancelQuestion')}
      </Text>
      <Text className="text-body text-text-secondary text-center mt-xs">
        {t('customer.bookings.cancelPrompt')}
      </Text>

      <View className="bg-muted rounded-md p-md">
        <Text
          className="text-label text-primary-deep text-center"
          style={{ lineHeight: typography.label * 1.5 }}
        >
          {warningText}
        </Text>
      </View>

      <View className="gap-sm">
        {cancelReasons.map((reason) => (
          <ReasonRow
            key={reason.id}
            label={reason.label}
            active={selectedReason === reason.id}
            onPress={() => setSelectedReason(reason.id)}
          />
        ))}
      </View>

      <View className="min-h-[100] bg-muted rounded-md p-md">
        <TextInput
          className="min-h-[80] text-body text-primary-deep"
          style={{ textAlignVertical: 'top' }}
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

      <View className="bg-muted rounded-md p-md">
        <Text
          className="text-caption text-text-secondary"
          style={{ lineHeight: typography.caption * 1.5 }}
        >
          {t('CustomerCancelSheet.copy4')}
        </Text>
      </View>

      <View className="gap-md">
        <Button
          label={t('customer.bookings.ctaCancelConfirm')}
          variant="destructive"
          onPress={() => void handleCancel()}
          isLoading={isPending}
          testID="cancel-confirm-btn"
          className="self-stretch"
        />
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          className="rounded-md border-2 border-primary-deep items-center justify-center"
          style={{ minHeight: mobileSurfaces.touchTarget.ctaHeight }}
          testID="cancel-go-back-btn"
        >
          <Text className="text-body text-primary-deep font-bold">
            {t('customer.bookings.ctaGoBack')}
          </Text>
        </Pressable>
      </View>
    </ModalSheetTemplate>
  );
}
