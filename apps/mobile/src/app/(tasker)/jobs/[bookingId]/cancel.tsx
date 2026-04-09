import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { ScreenContainer } from '../../../../components/shells';
import { ModalSheetTemplate } from '../../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../../components/ui/Button';
import { useCancelBooking } from '../../../../features/bookings/hooks/useCancelBooking';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function TaskerCancelBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [isOpen, setIsOpen] = useState(true);
  const { mutateAsync: cancelBooking, isPending } = useCancelBooking();

  const handleCancel = useCallback(async () => {
    if (!bookingId) return;
    try {
      const idempotencyKey = `cancel-${bookingId}-${Date.now()}`;
      await cancelBooking({ bookingId, idempotencyKey });
      setIsOpen(false);
      router.back();
    } catch {
      Alert.alert(
        t('common.error'),
        t('tasker.jobs.cancelError'),
      );
    }
  }, [bookingId, cancelBooking, router, t]);

  return (
    <ScreenContainer testID="SCR-TASK-015">
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.back();
        }}
        title={t('tasker.cancelBooking.title')}
        testID="tasker-cancel-booking-sheet"
      >
        <View className="items-center gap-lg">
          <AlertTriangle size={32} color={colors.danger} />
          <Text className="text-body text-mutedForeground text-center leading-6">
            {t('tasker.cancelBooking.warning')}
          </Text>
          <Button
            label={t('tasker.cancelBooking.confirm')}
            variant="destructive"
            onPress={() => void handleCancel()}
            isLoading={isPending}
            className="self-stretch"
          />
          <Button
            label={t('common.goBack')}
            variant="ghost"
            onPress={() => {
              setIsOpen(false);
              router.back();
            }}
            disabled={isPending}
            className="self-stretch"
          />
        </View>
      </ModalSheetTemplate>
    </ScreenContainer>
  );
}
