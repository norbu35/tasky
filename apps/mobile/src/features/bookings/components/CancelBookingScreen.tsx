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

const CANCEL_SCREEN_COPY_KEYS: Record<
  Role,
  {
    title: string;
    warning: string;
    confirm: string;
    error: string;
  }
> = {
  customer: {
    title: 'Cancel.title',
    warning: 'CustomerCancelSheet.copy1',
    confirm: 'Cancel.confirm',
    error: 'CustomerCancelSheet.cancelError',
  },
  tasker: {
    title: 'Cancel.title',
    warning: 'TaskerCancelSheet.copy1',
    confirm: 'Cancel.confirm',
    error: 'TaskerCancelSheet.cancelError',
  },
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
      Alert.alert(t('common.error'), t(CANCEL_SCREEN_COPY_KEYS[role].error));
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
        title={t(CANCEL_SCREEN_COPY_KEYS[role].title)}
        testID={SHEET_TEST_IDS[role]}
      >
        <View className="items-center gap-lg">
          <AlertTriangle size={24} color={colors.danger} />
          <Text className="text-body text-muted-foreground text-center leading-6">
            {t(CANCEL_SCREEN_COPY_KEYS[role].warning)}
          </Text>
          <Button
            label={t(CANCEL_SCREEN_COPY_KEYS[role].confirm)}
            variant="destructive"
            onPress={() => void handleCancel()}
            isLoading={isPending}
            className="self-stretch"
          />
          <Button
            label={t('common.back')}
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
