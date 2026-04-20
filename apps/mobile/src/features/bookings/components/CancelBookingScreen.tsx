import { useRouter, useLocalSearchParams } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';
import { useCancelBooking } from '@/features/bookings/hooks/useCancelBooking';

const { colors } = mobileTheme;

type Role = 'customer' | 'tasker';

interface CancelBookingScreenProps {
  role: Role;
}

const SCREEN_TEST_IDS: Record<Role, string> = {
  customer: 'SCR-CUST-022',
  tasker: 'SCR-TASK-015',
};

const SHEET_TEST_IDS: Record<Role, string> = {
  customer: 'cancel-booking-sheet',
  tasker: 'tasker-cancel-booking-sheet',
};

export default function CancelBookingScreen({ role }: CancelBookingScreenProps) {
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
        t(role === 'customer' ? 'customer.bookings.cancelError' : 'tasker.jobs.cancelError'),
      );
    }
  }, [bookingId, cancelBooking, router, t, role]);

  return (
    <ScreenContainer testID={SCREEN_TEST_IDS[role]}>
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.back();
        }}
        title={t(`${role}.cancelBooking.title`)}
        testID={SHEET_TEST_IDS[role]}
      >
        <View className="items-center gap-lg">
          <AlertTriangle size={24} color={colors.danger} />
          <Text className="text-body text-muted-foreground text-center leading-6">
            {t(`${role}.cancelBooking.warning`)}
          </Text>
          <Button
            label={t(`${role}.cancelBooking.confirm`)}
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
