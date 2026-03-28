import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

const MIN_BUDGET = 1001;

type PickerMode = 'date' | 'time' | null;

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
  return `${year}-${month}-${day}`;
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

export default function ScheduleBudgetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
    photos: string;
    location: string;
    lat: string;
    lng: string;
  }>();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<PickerMode>(null);
  const [budget, setBudget] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  const handlePickerChange = (event: { type?: string }, pickedValue?: Date) => {
    const pickerMode = activePicker;
    setActivePicker(null);

    if (event.type === 'dismissed' || !pickedValue || !pickerMode) {
      return;
    }

    if (pickerMode === 'date') {
      setSelectedDate(pickedValue);
    } else {
      setSelectedTime(pickedValue);
    }

    if (scheduleError) {
      setScheduleError('');
    }
  };

  const handleNext = () => {
    if (!selectedDate || !selectedTime) {
      setScheduleError(t('customer.postTask.scheduleRequired', 'Choose a date and time'));
      return;
    }

    const budgetNum = Number(budget);
    if (!budget || isNaN(budgetNum) || budgetNum < MIN_BUDGET) {
      setBudgetError(t('customer.postTask.budgetError', 'Budget must be at least \u20AE1,001'));
      return;
    }

    setBudgetError('');
    setScheduleError('');

    const scheduledAt = combineDateAndTime(selectedDate, selectedTime).toISOString();

    router.push({
      pathname: '/(customer)/tasks/new/review',
      params: {
        categoryId: params.categoryId,
        description: params.description,
        intakeAnswers: params.intakeAnswers,
        intakeSchemaVersion: params.intakeSchemaVersion,
        photos: params.photos,
        location: params.location,
        lat: params.lat,
        lng: params.lng,
        scheduledAt,
        budget,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <FormWizardTemplate
      currentStep={4}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={t('common.continue', 'Continue')}
      testID="schedule-budget-screen"
    >
      <Text style={styles.title}>
        {t('customer.postTask.schedulePageTitle', 'Schedule & Budget')}
      </Text>

      <FormField
        label={t('customer.postTask.scheduleDate', 'Date')}
        errorText={scheduleError || undefined}
      >
        <View style={styles.scheduleRow}>
          <Pressable
            onPress={() => setActivePicker('date')}
            style={({ pressed }) => [styles.pickerField, pressed ? styles.pickerFieldPressed : null]}
            testID="schedule-date-input"
          >
            <Text style={[styles.pickerText, selectedDate ? null : styles.pickerPlaceholder]}>
              {selectedDate
                ? formatDateValue(selectedDate)
                : t('customer.postTask.scheduleDatePlaceholder', 'Pick a date')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActivePicker('time')}
            style={({ pressed }) => [styles.pickerField, pressed ? styles.pickerFieldPressed : null]}
            testID="schedule-time-input"
          >
            <Text style={[styles.pickerText, selectedTime ? null : styles.pickerPlaceholder]}>
              {selectedTime
                ? formatTimeValue(selectedTime)
                : t('customer.postTask.scheduleTimePlaceholder', 'Pick a time')}
            </Text>
          </Pressable>
        </View>
      </FormField>

      <FormField
        label={t('customer.postTask.budgetLabel', 'Budget')}
        errorText={budgetError || undefined}
        helperText={t(
          'customer.postTask.budgetHelper',
          'Enter a fixed amount. Minimum: \u20AE1,001',
        )}
      >
        <Input
          testID="schedule-budget-input"
          value={budget}
          onChangeText={(text: string) => {
            setBudget(text);
            if (budgetError) setBudgetError('');
          }}
          placeholder={t('customer.postTask.budgetPlaceholder', '\u20AE Amount')}
          keyboardType="numeric"
          invalid={!!budgetError}
        />
      </FormField>

      {activePicker ? (
        <DateTimePicker
          testID={activePicker === 'date' ? 'schedule-date-picker' : 'schedule-time-picker'}
          value={activePicker === 'date' ? selectedDate ?? createDefaultScheduleDate() : selectedTime ?? createDefaultScheduleDate()}
          mode={activePicker}
          is24Hour
          onChange={handlePickerChange}
        />
      ) : null}
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
    marginBottom: spacing.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerField: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerFieldPressed: {
    opacity: 0.85,
  },
  pickerText: {
    color: colors.foreground,
    fontSize: typography.body,
  },
  pickerPlaceholder: {
    color: colors.mutedForeground,
  },
});
