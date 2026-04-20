import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Input } from '@/components/ui/Input';
import { mobileTheme } from '@/design/tokenAdapter';

import { RESCHEDULE_SURFACE } from './model';

const { colors, typography } = mobileTheme;

interface ReasonInputProps {
  reason: string;
  onReasonChange: (text: string) => void;
}

export function ReasonInput({ reason, onReasonChange }: ReasonInputProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-md">
      <Text className="text-body font-sans-bold text-primary-deep">
        {t('customer.bookings.labelReason')}
      </Text>
      <View
        className="bg-muted rounded-md p-md"
        style={{ minHeight: RESCHEDULE_SURFACE.reasonMinHeight }}
      >
        <Input
          style={{
            minHeight: RESCHEDULE_SURFACE.reasonInputMinHeight,
            color: colors.primaryDeep,
            fontSize: typography.body,
            textAlignVertical: 'top',
          }}
          placeholder={t('customer.bookings.placeholderReason')}
          placeholderTextColor={colors.chipInactive}
          value={reason}
          onChangeText={onReasonChange}
          maxLength={200}
          multiline
          numberOfLines={4}
          testID="reschedule-screen-reason"
        />
      </View>
      <Text className="text-caption text-text-secondary">
        {t('customer.bookings.helperReason')}
      </Text>
    </View>
  );
}
