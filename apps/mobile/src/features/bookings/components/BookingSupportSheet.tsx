import { Lock, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
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
      titleAlign="center"
      headerTrailing={
        <Touchable
          accessibilityRole="button"
          onPress={onClose}
          className="w-9 h-9 rounded-full bg-muted items-center justify-center"
          testID="booking-support-sheet-close"
        >
          <X size={20} color={mobileTheme.colors.foreground} />
        </Touchable>
      }
      footer={
        <Button
          label={t('booking.support.primary')}
          onPress={onPrimary}
          testID="booking-support-sheet-primary"
          className="self-stretch"
        />
      }
      contentClassName="gap-lg"
    >
      <View style={{ gap: mobileTheme.spacing.sm }}>
        <Text className="text-title font-display-bold text-foreground">
          {t('booking.support.prompt')}
        </Text>
        <View className="flex-row items-center" style={{ gap: mobileTheme.spacing.xs }}>
          <Lock size={16} color={mobileTheme.colors.foreground} />
          <Text className="flex-1 text-body text-foreground">
            {t('booking.support.privacyNote')}
          </Text>
        </View>
      </View>
      <View className="border-t border-border">
        {SUPPORT_REASON_KEYS.map((reasonKey) => {
          const isSelected = selectedReason === reasonKey;
          return (
            <Touchable
              key={reasonKey}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className="flex-row items-center justify-between border-b border-border py-md"
              onPress={() => setSelectedReason(reasonKey)}
              testID={`booking-support-reason-${reasonKey.split('.').pop()}`}
            >
              <Text className="flex-1 text-body text-foreground">{t(reasonKey)}</Text>
              <View
                className="w-6 h-6 rounded-full border items-center justify-center"
                style={{
                  borderColor: isSelected
                    ? mobileTheme.colors.foreground
                    : mobileTheme.colors.textTertiary,
                  backgroundColor: isSelected
                    ? mobileTheme.colors.foreground
                    : mobileTheme.colors.card,
                }}
              >
                {isSelected ? (
                  <View className="w-2 h-2 rounded-full bg-primary-foreground" />
                ) : null}
              </View>
            </Touchable>
          );
        })}
      </View>
    </ModalSheet>
  );
}
