import { CalendarDays, Clock3 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';

import { RESCHEDULE_SURFACE } from './model';

const { colors } = mobileTheme;

interface CurrentScheduleCardProps {
  scheduledAtLabel: string;
}

export function CurrentScheduleCard({ scheduledAtLabel }: CurrentScheduleCardProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between bg-muted rounded-lg p-lg">
      <View className="flex-1 gap-xs">
        <Text className="text-body text-text-secondary">
          {t('customer.bookings.sectionCurrentSchedule')}
        </Text>
        <View className="flex-row items-center gap-sm">
          <CalendarDays size={16} color={colors.primaryDeep} />
          <Text className="text-body font-sans-bold text-primary-deep">{scheduledAtLabel}</Text>
        </View>
      </View>
      <View
        className="rounded-md bg-card items-center justify-center"
        style={{
          width: RESCHEDULE_SURFACE.currentScheduleIconBox,
          height: RESCHEDULE_SURFACE.currentScheduleIconBox,
        }}
      >
        <Clock3 size={16} color={colors.secondary} />
      </View>
    </View>
  );
}
