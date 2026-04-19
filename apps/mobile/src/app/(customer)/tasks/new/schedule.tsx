import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';
import { cn } from '@/lib/cn';

const { colors } = mobileTheme;

const MIN_BUDGET = 5000;

type PickerMode = 'date' | 'time' | null;
type ActivePickerState = { mode: Exclude<PickerMode, null>; draftValue: Date } | null;

function createDefaultScheduleDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
}

function formatDateValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatTimeValue(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function combineDateAndTime(dateValue: Date, timeValue: Date): Date {
  const combined = new Date(dateValue);
  combined.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
  return combined;
}

function toValidDate(value: Date | null | undefined, fallback: Date): Date {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }
  return fallback;
}

function parseDateParam(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export default function ScheduleBudgetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
    intakeSchemaJson?: string;
    photos: string;
    location: string;
    lat: string;
    lng: string;
    scheduledAt?: string;
    budget?: string;
  }>();

  const parsedSchedule = parseDateParam(params.scheduledAt);
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsedSchedule);
  const [selectedTime, setSelectedTime] = useState<Date | null>(parsedSchedule);
  const [activePicker, setActivePicker] = useState<ActivePickerState>(null);
  const [budget, setBudget] = useState(params.budget ?? '');
  const [touchedBudget, setTouchedBudget] = useState(false);
  const [touchedSchedule, setTouchedSchedule] = useState(false);

  const schedule = useMemo(() => {
    if (!selectedDate || !selectedTime) {
      return null;
    }
    return combineDateAndTime(selectedDate, selectedTime);
  }, [selectedDate, selectedTime]);

  const budgetNumber = Number(budget);
  const isBudgetValid =
    budget !== '' && Number.isFinite(budgetNumber) && budgetNumber >= MIN_BUDGET;
  const isScheduleValid = Boolean(schedule) && schedule!.getTime() > Date.now();
  const canContinue = isBudgetValid && isScheduleValid;

  const budgetError =
    touchedBudget && budget !== '' && !isBudgetValid ? t('ScheduleBudgetScreen.budgetError') : '';
  const scheduleError =
    touchedSchedule && selectedDate && selectedTime && !isScheduleValid
      ? t('ScheduleBudgetScreen.schedulePastError')
      : '';

  const openPicker = (mode: Exclude<PickerMode, null>) => {
    const fallback = createDefaultScheduleDate();
    const currentValue =
      mode === 'date' ? toValidDate(selectedDate, fallback) : toValidDate(selectedTime, fallback);
    setTouchedSchedule(true);
    setActivePicker({ mode, draftValue: currentValue });
  };

  const handlePickerChange = (event: { type?: string }, pickedValue?: Date) => {
    const pickerMode = activePicker?.mode;

    if (event.type === 'dismissed' || !pickedValue || !pickerMode) {
      if (Platform.OS === 'android') {
        setActivePicker(null);
      }
      return;
    }

    if (Platform.OS === 'ios') {
      setActivePicker((prev) =>
        prev ? { ...prev, draftValue: toValidDate(pickedValue, prev.draftValue) } : prev,
      );
      return;
    }

    if (pickerMode === 'date') {
      setSelectedDate(pickedValue);
    } else {
      setSelectedTime(pickedValue);
    }
    setActivePicker(null);
  };

  const handlePickerCancel = () => {
    setActivePicker(null);
  };

  const handlePickerConfirm = () => {
    if (!activePicker) {
      return;
    }

    if (activePicker.mode === 'date') {
      setSelectedDate(activePicker.draftValue);
    } else {
      setSelectedTime(activePicker.draftValue);
    }
    setActivePicker(null);
  };

  const handleNext = () => {
    if (!canContinue || !schedule || schedule.getTime() <= Date.now()) {
      return;
    }

    router.push({
      pathname: '/(customer)/tasks/new/review',
      params: {
        categoryId: params.categoryId,
        categoryName: params.categoryName ?? '',
        description: params.description,
        intakeAnswers: params.intakeAnswers,
        intakeSchemaVersion: params.intakeSchemaVersion,
        intakeSchemaJson: params.intakeSchemaJson,
        photos: params.photos,
        location: params.location,
        lat: params.lat,
        lng: params.lng,
        scheduledAt: schedule.toISOString(),
        budget,
      },
    });
  };

  return (
    <FormWizardTemplate
      testID="SCR-CUST-006"
      currentStep={4}
      totalSteps={7}
      onNext={handleNext}
      onBack={() => router.back()}
      nextLabel={t('common.continue')}
      nextDisabled={!canContinue}
    >
      <View className="gap-sm" testID="schedule-header">
        <Text className="text-heading font-extrabold text-primary-deep">
          {t('ScheduleBudgetScreen.schedulePageTitle')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('ScheduleBudgetScreen.scheduleInstruction')}
        </Text>
      </View>

      {/* dateCard: shadow → imperative */}
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
              onPress={() => openPicker('date')}
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
              onPress={() => openPicker('time')}
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
                onChangeText={(text: string) => {
                  setBudget(text);
                  setTouchedBudget(true);
                }}
                onBlur={() => setTouchedBudget(true)}
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

      {activePicker ? (
        Platform.OS === 'ios' ? (
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
                onPress={handlePickerCancel}
                className="flex-1"
              />
              <Button
                testID="schedule-picker-confirm"
                label={t('common.confirm')}
                onPress={handlePickerConfirm}
                className="flex-1"
              />
            </View>
            <DateTimePicker
              testID={
                activePicker.mode === 'date' ? 'schedule-date-picker' : 'schedule-time-picker'
              }
              value={toValidDate(activePicker.draftValue, createDefaultScheduleDate())}
              mode={activePicker.mode}
              display="spinner"
              is24Hour
              onChange={handlePickerChange}
              minimumDate={activePicker.mode === 'date' ? new Date() : undefined}
            />
          </View>
        ) : (
          <DateTimePicker
            testID={activePicker.mode === 'date' ? 'schedule-date-picker' : 'schedule-time-picker'}
            value={toValidDate(activePicker.draftValue, createDefaultScheduleDate())}
            mode={activePicker.mode}
            is24Hour
            onChange={handlePickerChange}
            minimumDate={activePicker.mode === 'date' ? new Date() : undefined}
          />
        )
      ) : null}
    </FormWizardTemplate>
  );
}
