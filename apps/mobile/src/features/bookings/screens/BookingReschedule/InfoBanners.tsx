import { Info } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';

import { RESCHEDULE_SURFACE } from './model';

const { colors, typography } = mobileTheme;

export function StepIndicator() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between px-sm">
      <View className="items-center gap-xs">
        <View
          className="rounded-md bg-primary-deep items-center justify-center"
          style={{
            width: RESCHEDULE_SURFACE.stepBadge,
            height: RESCHEDULE_SURFACE.stepBadge,
          }}
        >
          <Text className="text-micro font-sans-bold text-primary-foreground">1</Text>
        </View>
        <Text className="text-overline font-sans-bold text-text-secondary uppercase">
          {t('customer.bookings.stepChooseDay')}
        </Text>
      </View>
      <View className="flex-1 h-[2px] mx-sm bg-border" />
      <View className="items-center gap-xs opacity-[0.45]">
        <View
          className="rounded-md bg-muted items-center justify-center"
          style={{
            width: RESCHEDULE_SURFACE.stepBadge,
            height: RESCHEDULE_SURFACE.stepBadge,
          }}
        >
          <Text className="text-micro font-sans-bold text-primary-deep">2</Text>
        </View>
        <Text className="text-overline font-sans-bold text-text-secondary uppercase">
          {t('customer.bookings.stepConfirm')}
        </Text>
      </View>
    </View>
  );
}

export function PolicyNote() {
  const { t } = useTranslation();
  return (
    <View className="flex-row gap-sm items-start bg-muted rounded-md p-md">
      <Info size={16} color={colors.primaryDeep} />
      <Text
        className="flex-1 text-caption text-primary-deep"
        style={{ lineHeight: typography.caption * 1.5 }}
      >
        {t('customer.bookings.scheduleAuthorityNote')}
      </Text>
    </View>
  );
}
