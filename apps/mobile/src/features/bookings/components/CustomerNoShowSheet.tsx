import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';

import { useFlagNoShow } from '../hooks/useFlagNoShow';

const { typography } = mobileTheme;

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
        <Text className="text-body text-verified font-semibold text-center my-lg">
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
        <Text className="text-body text-accent mb-md" style={{ lineHeight: typography.body * 1.6 }}>
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
      <Text className="text-body text-accent mb-md" style={{ lineHeight: typography.body * 1.6 }}>
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
      <View className="bg-muted rounded-md p-md mt-sm">
        <Text
          className="text-caption text-text-secondary"
          style={{ lineHeight: typography.caption * 1.5 }}
        >
          {t('CustomerNoShowSheet.copy3')}
        </Text>
      </View>
    </ModalSheetTemplate>
  );
}
