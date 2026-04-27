import { X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import { Button } from './Button';
import { ModalSheet } from './ModalSheet';
import { Touchable } from './Touchable';

type PickerMode = 'date' | 'time';

interface Props {
  mode: PickerMode;
  draftDate: Date;
  draftTime: Date;
  dateOptions: Date[];
  timeOptions: Date[];
  onModeChange: (mode: PickerMode) => void;
  onDateChange: (value: Date) => void;
  onTimeChange: (value: Date) => void;
  onReset: () => void;
  onClose: () => void;
  onSave: () => void;
}

const { colors } = mobileTheme;

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameTime(a: Date, b: Date): boolean {
  return a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();
}

function formatMonth(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(value);
}

function formatTime(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function buildCalendarRows(dateOptions: Date[]): Array<Array<Date | null>> {
  if (dateOptions.length === 0) return [];
  const leading = dateOptions[0].getDay();
  const cells: Array<Date | null> = [
    ...Array.from({ length: leading }, () => null),
    ...dateOptions,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: Array<Array<Date | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }
  return rows;
}

function useWeekdayLabels(locale: string): string[] {
  return useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2026, 0, 4 + index)),
      ),
    [locale],
  );
}

export function SchedulePickerSheet({
  mode,
  draftDate,
  draftTime,
  dateOptions,
  timeOptions,
  onModeChange,
  onDateChange,
  onTimeChange,
  onReset,
  onClose,
  onSave,
}: Props) {
  const { i18n, t } = useTranslation();
  const weekdayLabels = useWeekdayLabels(i18n.language);
  const rows = useMemo(() => buildCalendarRows(dateOptions), [dateOptions]);
  const firstMonth = dateOptions[0] ?? draftDate;

  return (
    <ModalSheet
      visible
      title={t('ScheduleBudgetScreen.schedulePickerTitle')}
      onClose={onClose}
      titleAlign="center"
      testID="schedule-picker-sheet"
      className="rounded-tl-[32px] rounded-tr-[32px] gap-lg px-lg pt-lg"
      contentClassName="gap-lg"
      hideDefaultAction
      headerLeading={
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-full"
          testID="schedule-picker-close"
        >
          <X size={22} color={colors.foreground} />
        </Touchable>
      }
      footer={
        <View className="border-t border-border pt-lg">
          <View className="flex-row items-center justify-between gap-md">
            <Touchable
              accessibilityRole="button"
              onPress={onReset}
              className="min-h-[52px] justify-center"
              testID="schedule-picker-reset"
            >
              <Text className="text-body font-sans-bold underline text-foreground">
                {t('ScheduleBudgetScreen.schedulePickerReset')}
              </Text>
            </Touchable>
            <Button
              label={t('common.save')}
              onPress={onSave}
              testID="schedule-picker-save"
              className="min-w-[148px]"
            />
          </View>
        </View>
      }
    >
      <View className="rounded-full bg-muted p-xs flex-row">
        {(['date', 'time'] as const).map((tab) => {
          const selected = mode === tab;
          return (
            <Touchable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onModeChange(tab)}
              className="flex-1 min-h-[48px] items-center justify-center rounded-full"
              style={{ backgroundColor: selected ? colors.card : colors.muted }}
              testID={tab === 'date' ? 'schedule-picker-date-tab' : 'schedule-picker-time-tab'}
            >
              <Text
                className={cn('text-body', selected ? 'font-sans-bold' : 'font-sans-medium')}
                style={{ color: selected ? colors.foreground : colors.mutedForeground }}
              >
                {tab === 'date'
                  ? t('ScheduleBudgetScreen.scheduleDate')
                  : t('ScheduleBudgetScreen.scheduleTime')}
              </Text>
            </Touchable>
          );
        })}
      </View>

      {mode === 'date' ? (
        <View className="gap-md" testID="schedule-calendar-grid">
          <View className="flex-row justify-between px-sm">
            {weekdayLabels.map((label, index) => (
              <Text
                key={`${label}-${index}`}
                className="w-[13%] text-center text-body font-sans-medium text-muted-foreground"
              >
                {label}
              </Text>
            ))}
          </View>
          <Text className="text-heading font-sans-bold text-foreground">
            {formatMonth(firstMonth, i18n.language)}
          </Text>
          <View className="gap-xs">
            {rows.map((row, rowIndex) => (
              <View
                key={`week-${rowIndex}`}
                className="min-h-[54px] flex-row items-center rounded-md"
                style={{ backgroundColor: colors.muted }}
              >
                {row.map((date, columnIndex) => {
                  const optionIndex = dateOptions.findIndex(
                    (option) => date && isSameDate(option, date),
                  );
                  const selected = date ? isSameDate(date, draftDate) : false;
                  return (
                    <View key={`${rowIndex}-${columnIndex}`} className="flex-1 items-center">
                      {date ? (
                        <Touchable
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => onDateChange(date)}
                          className="h-11 w-11 items-center justify-center rounded-full"
                          style={{ backgroundColor: selected ? colors.foreground : 'transparent' }}
                          testID={`schedule-day-option-${optionIndex}`}
                        >
                          <Text
                            className="text-body font-sans-bold"
                            style={{ color: selected ? colors.background : colors.foreground }}
                          >
                            {date.getDate()}
                          </Text>
                        </Touchable>
                      ) : (
                        <View className="h-11 w-11" />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap gap-sm" testID="schedule-time-grid">
            {timeOptions.map((time, index) => {
              const selected = isSameTime(time, draftTime);
              return (
                <Touchable
                  key={time.toISOString()}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onTimeChange(time)}
                  className="min-h-[48px] min-w-[92px] items-center justify-center rounded-full border px-md"
                  style={{
                    borderColor: selected ? colors.foreground : colors.border,
                    backgroundColor: selected ? colors.foreground : colors.card,
                  }}
                  testID={`schedule-time-option-${index}`}
                >
                  <Text
                    className="text-body font-sans-bold"
                    style={{ color: selected ? colors.background : colors.foreground }}
                  >
                    {formatTime(time)}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </ModalSheet>
  );
}
