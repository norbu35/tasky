import { Clock3 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import { RESCHEDULE_SURFACE, isTimeSelected, AVAILABLE_TIMES } from './BookingReschedule.model';

const { colors } = mobileTheme;

interface TimeSlotListProps {
  selectedDateTime: Date;
  onSelectTime: (time: string) => void;
}

export function TimeSlotList({ selectedDateTime, onSelectTime }: TimeSlotListProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-md">
      <View className="flex-row items-center gap-xs">
        <Clock3 size={16} color={colors.primaryDeep} />
        <Text
          className="text-heading font-sans-bold text-primary-deep"
          style={{ fontWeight: '800' }}
        >
          {t('customer.bookings.sectionAvailableTimes')}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-sm">
        {AVAILABLE_TIMES.map((time) => {
          const selected = isTimeSelected(selectedDateTime, time);
          return (
            <Touchable
              key={time}
              onPress={() => onSelectTime(time)}
              className={cn(
                'rounded-md bg-muted items-center justify-center px-lg',
                selected && 'bg-primary-deep',
              )}
              style={[
                {
                  minWidth: RESCHEDULE_SURFACE.timeChipMinWidth,
                  minHeight: RESCHEDULE_SURFACE.timeChipMinHeight,
                },
                selected ? elevations.soft : undefined,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`reschedule-time-${time}`}
            >
              <Text
                className={cn(
                  'text-label font-sans-bold text-primary-deep',
                  selected && 'text-primary-foreground',
                )}
              >
                {time}
              </Text>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}
