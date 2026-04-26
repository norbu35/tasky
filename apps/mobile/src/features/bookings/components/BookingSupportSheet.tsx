import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheet } from '@/components/ui/ModalSheet';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

const SUPPORT_REASON_KEYS = [
  'booking.support.reasonArrival',
  'booking.support.reasonSchedule',
  'booking.support.reasonSafety',
] as const;

interface BookingSupportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPrimary: () => void;
}

export function BookingSupportSheet({ isOpen, onClose, onPrimary }: BookingSupportSheetProps) {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = React.useState<(typeof SUPPORT_REASON_KEYS)[number]>(
    SUPPORT_REASON_KEYS[0],
  );

  if (!isOpen) return null;

  return (
    <ModalSheet
      visible={isOpen}
      title={t('booking.support.title')}
      onClose={onClose}
      testID="booking-support-sheet"
      primaryAction={{
        label: t('booking.support.primary'),
        onPress: onPrimary,
        testID: 'booking-support-sheet-primary',
      }}
      secondaryAction={{ label: t('common.cancel'), onPress: onClose }}
    >
      <Text className="text-caption text-text-secondary leading-[20px]">
        {t('booking.support.description')}
      </Text>
      <View className="gap-sm">
        {SUPPORT_REASON_KEYS.map((reasonKey) => {
          const isSelected = selectedReason === reasonKey;
          return (
            <Touchable
              key={reasonKey}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className="rounded-md border px-md py-sm"
              style={{
                borderColor: isSelected ? mobileTheme.colors.primary : mobileTheme.colors.border,
                backgroundColor: isSelected ? mobileTheme.colors.muted : mobileTheme.colors.card,
              }}
              onPress={() => setSelectedReason(reasonKey)}
              testID={`booking-support-reason-${reasonKey.split('.').pop()}`}
            >
              <Text className="text-label font-sans-semibold text-foreground">{t(reasonKey)}</Text>
            </Touchable>
          );
        })}
      </View>
    </ModalSheet>
  );
}
