import { CalendarDays, Check } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import {
  type ActivePickerState,
  createDefaultScheduleDate,
  createScheduleDateOptions,
  createScheduleTimeOptions,
  formatDateValue,
  formatTimeValue,
  isSameScheduleDate,
  isSameScheduleTime,
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
  onPickerDraftChange: (pickedValue: Date) => void;
  onPickerCancel: () => void;
  onPickerConfirm: () => void;
}

export function PickerSection({
  activePicker,
  onPickerDraftChange,
  onPickerCancel,
  onPickerConfirm,
}: PickerSectionProps) {
  const { t } = useTranslation();

  if (!activePicker) return null;

  const draftValue = toValidDate(activePicker.draftValue, createDefaultScheduleDate());
  const options =
    activePicker.mode === 'date'
      ? createScheduleDateOptions()
      : createScheduleTimeOptions(draftValue);

  return (
    <ModalSheet
      visible
      title={
        activePicker.mode === 'date'
          ? t('ScheduleBudgetScreen.scheduleDate')
          : t('ScheduleBudgetScreen.scheduleTime')
      }
      onClose={onPickerCancel}
      testID="schedule-picker-sheet"
      primaryAction={{
        label: t('common.confirm'),
        onPress: onPickerConfirm,
        testID: 'schedule-picker-confirm',
      }}
      secondaryAction={{
        label: t('common.cancel'),
        onPress: onPickerCancel,
        testID: 'schedule-picker-cancel',
      }}
    >
      <Text className="text-caption text-text-secondary">
        {t('ScheduleBudgetScreen.schedulePickerHint')}
      </Text>
      <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
        <View className="gap-sm">
          {options.map((option, index) => {
            const selected =
              activePicker.mode === 'date'
                ? isSameScheduleDate(option, draftValue)
                : isSameScheduleTime(option, draftValue);
            const label =
              activePicker.mode === 'date' ? formatDateValue(option) : formatTimeValue(option);
            const testID =
              activePicker.mode === 'date'
                ? `schedule-date-option-${index}`
                : `schedule-time-option-${index}`;

            return (
              <Touchable
                key={option.toISOString()}
                testID={testID}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onPickerDraftChange(option)}
                className="min-h-[48px] flex-row items-center justify-between rounded-md border px-md py-sm"
                style={({ pressed }) => ({
                  borderColor: selected ? colors.primaryDeep : colors.border,
                  backgroundColor: selected ? colors.primaryDeep : colors.card,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <Text
                  className="text-body font-sans-bold"
                  style={{ color: selected ? colors.primaryForeground : colors.foreground }}
                >
                  {label}
                </Text>
                {selected ? <Check size={18} color={colors.primaryForeground} /> : null}
              </Touchable>
            );
          })}
        </View>
      </ScrollView>
    </ModalSheet>
  );
}
