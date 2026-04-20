import { ChevronLeft as ChevronLeftIcon, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import { RESCHEDULE_SURFACE, formatMonthTitle, sameDay } from './BookingReschedule.model';

const { colors } = mobileTheme;

interface DatePickerProps {
  visibleMonth: Date;
  calendarCells: (Date | null)[];
  weekdayLabels: string[];
  selectedDateTime: Date;
  tomorrow: Date;
  onSelectDay: (date: Date) => void;
}

export function DatePicker({
  visibleMonth,
  calendarCells,
  weekdayLabels,
  selectedDateTime,
  tomorrow,
  onSelectDay,
}: DatePickerProps) {
  return (
    <View className="bg-muted rounded-lg p-lg gap-lg" style={elevations.soft}>
      <View className="flex-row items-center justify-between">
        <Text className="text-subtitle font-sans-bold text-primary-deep">
          {formatMonthTitle(visibleMonth)}
        </Text>
        <View className="flex-row gap-xs">
          <Touchable
            className="rounded-sm bg-muted items-center justify-center"
            style={{
              width: RESCHEDULE_SURFACE.navIconBox,
              height: RESCHEDULE_SURFACE.navIconBox,
            }}
            accessibilityRole="button"
            testID="reschedule-month-prev"
          >
            <ChevronLeftIcon size={RESCHEDULE_SURFACE.calendarNavIcon} color={colors.primaryDeep} />
          </Touchable>
          <Touchable
            className="rounded-sm bg-muted items-center justify-center"
            style={{
              width: RESCHEDULE_SURFACE.navIconBox,
              height: RESCHEDULE_SURFACE.navIconBox,
            }}
            accessibilityRole="button"
            testID="reschedule-month-next"
          >
            <ChevronRight size={RESCHEDULE_SURFACE.calendarNavIcon} color={colors.primaryDeep} />
          </Touchable>
        </View>
      </View>

      <View className="flex-row">
        {weekdayLabels.map((day) => (
          <Text
            key={day}
            className="flex-1 text-center text-micro font-sans-bold text-text-secondary tracking-wide"
          >
            {day}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {calendarCells.map((cell, index) => {
          if (!cell) {
            return (
              <View
                key={`empty-${index}`}
                className="aspect-square items-center justify-center rounded-sm"
                style={{ width: RESCHEDULE_SURFACE.calendarCellWidth }}
              />
            );
          }
          const isSelected = sameDay(cell, selectedDateTime);
          const isTomorrow = sameDay(cell, tomorrow);
          const isPast = cell < tomorrow;
          const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;
          return (
            <Touchable
              key={cell.toISOString()}
              onPress={() => onSelectDay(cell)}
              className={cn(
                'aspect-square items-center justify-center rounded-sm',
                isSelected && 'bg-primary-deep',
                isPast && 'opacity-25',
              )}
              style={[
                { width: RESCHEDULE_SURFACE.calendarCellWidth },
                isSelected ? elevations.soft : undefined,
              ]}
              testID={
                isSelected
                  ? 'reschedule-screen-date-picker'
                  : `reschedule-date-${cell.toISOString()}`
              }
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isPast }}
            >
              <Text
                className={cn(
                  'text-label text-primary-deep font-medium',
                  isSelected && 'text-primary-foreground font-sans-bold',
                  isPast && 'text-text-secondary',
                  isWeekend && !isSelected && 'text-danger',
                  isTomorrow && !isSelected && 'text-danger',
                )}
              >
                {cell.getDate()}
              </Text>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}
