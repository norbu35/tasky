import { CalendarDays } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { SchedulePickerSheet } from '@/components/ui/SchedulePickerSheet';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';

import {
  type ActivePickerState,
  createRescheduleDateOptions,
  createRescheduleTimeOptions,
  formatDateValue,
  formatTimeValue,
  type PickerMode,
} from './model';

const { colors } = mobileTheme;

interface ScheduleFieldsProps {
  selectedDate: Date;
  selectedTime: Date;
  activePicker: ActivePickerState;
  onOpenPicker: (mode: PickerMode) => void;
  onPickerModeChange: (mode: PickerMode) => void;
  onPickerDateChange: (pickedValue: Date) => void;
  onPickerTimeChange: (pickedValue: Date) => void;
  onPickerReset: () => void;
  onPickerCancel: () => void;
  onPickerConfirm: () => void;
}

export function ScheduleFields({
  selectedDate,
  selectedTime,
  activePicker,
  onOpenPicker,
  onPickerModeChange,
  onPickerDateChange,
  onPickerTimeChange,
  onPickerReset,
  onPickerCancel,
  onPickerConfirm,
}: ScheduleFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <View className="rounded-lg bg-muted gap-lg p-xl" style={elevations.soft}>
        <View className="flex-row items-center gap-sm">
          <CalendarDays size={20} color={colors.primary} />
          <Text className="text-body font-display-bold text-primary-deep">
            {t('customer.bookings.labelNewSchedule')}
          </Text>
        </View>

        <FormField label={t('customer.bookings.labelNewSchedule')}>
          <View className="flex-row gap-sm">
            <Touchable
              accessibilityRole="button"
              onPress={() => onOpenPicker('date')}
              className="flex-1 justify-center rounded-md px-md py-sm"
              style={({ pressed }) => ({
                minHeight: mobileSurfaces.touchTarget.ctaHeight,
                borderWidth: 1,
                borderColor: colors.primaryDeep,
                backgroundColor: colors.primaryDeep,
                opacity: pressed ? 0.85 : 1,
              })}
              testID="reschedule-date-input"
            >
              <Text
                className="text-body font-sans-bold"
                style={{ color: colors.primaryForeground }}
              >
                {formatDateValue(selectedDate)}
              </Text>
            </Touchable>

            <Touchable
              accessibilityRole="button"
              onPress={() => onOpenPicker('time')}
              className="flex-1 justify-center rounded-md px-md py-sm"
              style={({ pressed }) => ({
                minHeight: mobileSurfaces.touchTarget.ctaHeight,
                borderWidth: 1,
                borderColor: colors.primaryDeep,
                backgroundColor: colors.primaryDeep,
                opacity: pressed ? 0.85 : 1,
              })}
              testID="reschedule-time-input"
            >
              <Text
                className="text-body font-sans-bold"
                style={{ color: colors.primaryForeground }}
              >
                {formatTimeValue(selectedTime)}
              </Text>
            </Touchable>
          </View>
        </FormField>
      </View>

      {activePicker ? (
        <SchedulePickerSheet
          mode={activePicker.mode}
          draftDate={activePicker.draftDate}
          draftTime={activePicker.draftTime}
          dateOptions={createRescheduleDateOptions()}
          timeOptions={createRescheduleTimeOptions(activePicker.draftDate)}
          onModeChange={onPickerModeChange}
          onDateChange={onPickerDateChange}
          onTimeChange={onPickerTimeChange}
          onReset={onPickerReset}
          onClose={onPickerCancel}
          onSave={onPickerConfirm}
        />
      ) : null}
    </>
  );
}
