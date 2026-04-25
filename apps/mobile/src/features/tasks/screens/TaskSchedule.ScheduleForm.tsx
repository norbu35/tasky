import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import {
  type ActivePickerState,
  createDefaultScheduleDate,
  formatDateValue,
  formatTimeValue,
  toValidDate,
} from './TaskSchedule.model';

const { colors } = mobileTheme;

interface DateCardProps {
  selectedDate: Date | null;
  selectedTime: Date | null;
  scheduleError: string;
  onOpenPicker: (mode: 'date' | 'time') => void;
}

export function DateCard({
  selectedDate,
  selectedTime,
  scheduleError,
  onOpenPicker,
}: DateCardProps) {
  const { t } = useTranslation();

  return (
    <View className="rounded-lg bg-muted gap-lg p-[20px]" style={elevations.soft}>
      <View className="flex-row items-center gap-sm">
        <CalendarDays size={20} color={colors.primary} />
        <Text className="text-body font-extrabold text-primary-deep">
          {t('ScheduleBudgetScreen.scheduleLabel')}
        </Text>
      </View>

      <FormField
        label={t('ScheduleBudgetScreen.scheduleDate')}
        errorText={scheduleError || undefined}
        helperText={t('ScheduleBudgetScreen.scheduleHelper')}
      >
        <View className="flex-row gap-sm">
          <Touchable
            onPress={() => onOpenPicker('date')}
            className="flex-1 justify-center rounded-md px-md py-sm"
            style={({ pressed }) => ({
              minHeight: mobileSurfaces.touchTarget.ctaHeight,
              borderWidth: 1,
              borderColor: selectedDate ? colors.primaryDeep : colors.input,
              backgroundColor: selectedDate ? colors.primaryDeep : colors.background,
              opacity: pressed ? 0.85 : 1,
            })}
            testID="schedule-date-input"
          >
            <Text
              className={cn('text-body', selectedDate ? 'font-sans-bold' : 'font-sans-medium')}
              style={{ color: selectedDate ? colors.primaryForeground : colors.mutedForeground }}
            >
              {selectedDate
                ? formatDateValue(selectedDate)
                : t('ScheduleBudgetScreen.scheduleDatePlaceholder')}
            </Text>
          </Touchable>

          <Touchable
            onPress={() => onOpenPicker('time')}
            className="flex-1 justify-center rounded-md px-md py-sm"
            style={({ pressed }) => ({
              minHeight: mobileSurfaces.touchTarget.ctaHeight,
              borderWidth: 1,
              borderColor: selectedTime ? colors.primaryDeep : colors.input,
              backgroundColor: selectedTime ? colors.primaryDeep : colors.background,
              opacity: pressed ? 0.85 : 1,
            })}
            testID="schedule-time-input"
          >
            <Text
              className={cn('text-body', selectedTime ? 'font-sans-bold' : 'font-sans-medium')}
              style={{ color: selectedTime ? colors.primaryForeground : colors.mutedForeground }}
            >
              {selectedTime
                ? formatTimeValue(selectedTime)
                : t('ScheduleBudgetScreen.scheduleTimePlaceholder')}
            </Text>
          </Touchable>
        </View>
      </FormField>
    </View>
  );
}

interface BudgetFieldProps {
  budget: string;
  budgetError: string;
  onBudgetChange: (text: string) => void;
  onBudgetBlur: () => void;
}

export function BudgetField({
  budget,
  budgetError,
  onBudgetChange,
  onBudgetBlur,
}: BudgetFieldProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-sm">
      <FormField
        label={t('ScheduleBudgetScreen.budgetLabel')}
        errorText={budgetError || undefined}
        helperText={t('ScheduleBudgetScreen.budgetHelper')}
      >
        <View className="flex-row items-center gap-sm">
          <Text className="text-heading font-sans-bold text-primary-deep">₮</Text>
          <View className="flex-1">
            <Input
              testID="schedule-budget-input"
              value={budget}
              onChangeText={onBudgetChange}
              onBlur={onBudgetBlur}
              placeholder={t('ScheduleBudgetScreen.budgetPlaceholder')}
              keyboardType="numeric"
              invalid={Boolean(budgetError)}
            />
          </View>
        </View>
      </FormField>
      <Text className="text-caption font-semibold text-accent leading-relaxed">
        {t('ScheduleBudgetScreen.budgetTypicalRange')}
      </Text>
      <Text className="text-caption font-semibold text-muted-foreground leading-relaxed">
        {t('ScheduleBudgetScreen.budgetGoldHint')}
      </Text>
    </View>
  );
}

interface PickerSectionProps {
  activePicker: ActivePickerState;
  onPickerChange: (event: { type?: string }, pickedValue?: Date) => void;
  onPickerCancel: () => void;
  onPickerConfirm: () => void;
}

export function PickerSection({
  activePicker,
  onPickerChange,
  onPickerCancel,
  onPickerConfirm,
}: PickerSectionProps) {
  const { t } = useTranslation();

  if (!activePicker) return null;

  if (Platform.OS === 'ios') {
    return (
      <View
        className="rounded-lg border border-border bg-card p-md gap-sm"
        testID="schedule-ios-picker-card"
      >
        <View className="gap-xs">
          <Text className="text-label font-bold text-primary-deep uppercase tracking-[0.6px]">
            {activePicker.mode === 'date'
              ? t('ScheduleBudgetScreen.scheduleDate')
              : t('ScheduleBudgetScreen.scheduleTime')}
          </Text>
          <Text className="text-caption text-text-secondary">
            {t('ScheduleBudgetScreen.schedulePickerHint')}
          </Text>
        </View>
        <View className="flex-row gap-sm mt-xs">
          <Button
            testID="schedule-picker-cancel"
            label={t('common.cancel')}
            variant="outline"
            onPress={onPickerCancel}
            className="flex-1"
          />
          <Button
            testID="schedule-picker-confirm"
            label={t('common.confirm')}
            onPress={onPickerConfirm}
            className="flex-1"
          />
        </View>
        <DateTimePicker
          testID={activePicker.mode === 'date' ? 'schedule-date-picker' : 'schedule-time-picker'}
          value={toValidDate(activePicker.draftValue, createDefaultScheduleDate())}
          mode={activePicker.mode}
          display="spinner"
          is24Hour
          onChange={onPickerChange}
          minimumDate={activePicker.mode === 'date' ? new Date() : undefined}
        />
      </View>
    );
  }

  return (
    <DateTimePicker
      testID={activePicker.mode === 'date' ? 'schedule-date-picker' : 'schedule-time-picker'}
      value={toValidDate(activePicker.draftValue, createDefaultScheduleDate())}
      mode={activePicker.mode}
      is24Hour
      onChange={onPickerChange}
      minimumDate={activePicker.mode === 'date' ? new Date() : undefined}
    />
  );
}
