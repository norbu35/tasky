import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';
import { generateIdempotencyKey } from '@/utils/uuid';
import { useCancelBooking } from '@/features/bookings';

const { colors } = mobileTheme;

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
    ? t('customer.cancelSheet.titleLate')
    : isAssigned
      ? t('customer.cancelSheet.titleAssigned')
      : t('customer.cancelSheet.titleOpen');

  const body = isLate
    ? t('TaskCancelSheet.copy1')
    : isAssigned
      ? t('TaskCancelSheet.copy2')
      : t('customer.cancelSheet.bodyOpen');

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
      <View className="gap-lg">
        <View
          className="w-[44] h-[44] rounded-full items-center justify-center"
          style={{ backgroundColor: `${colors.danger}14` }}
        >
          <AlertTriangle size={20} color={colors.danger} />
        </View>
        <Text className="text-body text-muted-foreground leading-relaxed">{body}</Text>

        {isLate ? (
          <View
            className="rounded-md p-md border-l-[3] border-l-danger"
            style={{ backgroundColor: `${colors.danger}15` }}
          >
            <Text className="text-label text-danger leading-normal">
              {t('TaskCancelSheet.copy3')}
            </Text>
          </View>
        ) : null}

        <Button
          label={t('customer.cancelSheet.confirm')}
          variant="destructive"
          onPress={handleConfirmCancel}
          isLoading={cancelBooking.isPending}
          testID="task-cancel-confirm"
        />

        <Pressable onPress={onClose} className="py-sm items-center">
          <Text className="text-body font-semibold text-text-secondary">
            {t('customer.cancelSheet.goBack')}
          </Text>
        </Pressable>
      </View>
    </ModalSheetTemplate>
  );
}
