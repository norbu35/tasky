import React, { useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme, elevations } from '../../../../design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

const MIN_BUDGET = 1001;

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
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
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
    touchedBudget && budget !== '' && !isBudgetValid
      ? t('customer.postTask.budgetError', 'Budget must be at least ₮1,001')
      : '';
  const scheduleError =
    touchedSchedule && selectedDate && selectedTime && !isScheduleValid
      ? t('customer.postTask.schedulePastError', 'Cannot select a past date/time')
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
        description: params.description,
        intakeAnswers: params.intakeAnswers,
        intakeSchemaVersion: params.intakeSchemaVersion,
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
      currentStep={4}
      totalSteps={7}
      onNext={handleNext}
      onBack={() => router.back()}
      nextLabel={t('common.continue', 'Continue')}
      nextDisabled={!canContinue}
      testID="schedule-budget-screen"
    >
      <View style={styles.hero}>
        <Text style={styles.stepLabel}>
          {t('taskPost.step', 'Step {{current}} of {{total}}')
            .replace('{{current}}', '5')
            .replace('{{total}}', '7')}
        </Text>
        <Text style={styles.title}>
          {t('customer.postTask.schedulePageTitle', 'Schedule & Budget')}
        </Text>
        <Text style={styles.subtitle}>
          {t(
            'customer.postTask.scheduleInstruction',
            'Pick when the task should happen and set your budget.',
          )}
        </Text>
      </View>

      <View style={styles.dateCard}>
        <View style={styles.dateCardHeader}>
          <CalendarDays size={18} color={colors.primary} />
          <Text style={styles.dateCardTitle}>
            {t('customer.postTask.scheduleLabel', 'When do you need this done?')}
          </Text>
        </View>

        <FormField
          label={t('customer.postTask.scheduleDate', 'Date')}
          errorText={scheduleError || undefined}
          helperText={t('customer.postTask.scheduleHelper', 'Select a date and time')}
        >
          <View style={styles.scheduleRow}>
            <Pressable
              onPress={() => openPicker('date')}
              style={({ pressed }) => [
                styles.pickerField,
                selectedDate ? styles.pickerFieldActive : null,
                pressed ? styles.pickerFieldPressed : null,
              ]}
              testID="schedule-date-input"
            >
              <Text
                style={[
                  styles.pickerText,
                  selectedDate ? styles.pickerTextActive : styles.pickerPlaceholder,
                ]}
              >
                {selectedDate
                  ? formatDateValue(selectedDate)
                  : t('customer.postTask.scheduleDatePlaceholder', 'Pick a date')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => openPicker('time')}
              style={({ pressed }) => [
                styles.pickerField,
                selectedTime ? styles.pickerFieldActive : null,
                pressed ? styles.pickerFieldPressed : null,
              ]}
              testID="schedule-time-input"
            >
              <Text
                style={[
                  styles.pickerText,
                  selectedTime ? styles.pickerTextActive : styles.pickerPlaceholder,
                ]}
              >
                {selectedTime
                  ? formatTimeValue(selectedTime)
                  : t('customer.postTask.scheduleTimePlaceholder', 'Pick a time')}
              </Text>
            </Pressable>
          </View>
        </FormField>
      </View>

      <View style={styles.budgetSection}>
        <Text style={styles.budgetHeading}>{t('customer.postTask.budgetLabel', 'Budget')}</Text>
        <FormField
          errorText={budgetError || undefined}
          helperText={t('customer.postTask.budgetHelper', 'Enter a fixed amount. Minimum: ₮1,001')}
        >
          <Input
            testID="schedule-budget-input"
            value={budget}
            onChangeText={(text: string) => {
              setBudget(text);
              setTouchedBudget(true);
            }}
            onBlur={() => setTouchedBudget(true)}
            placeholder={t('customer.postTask.budgetPlaceholder', '₮50,000')}
            keyboardType="numeric"
            invalid={Boolean(budgetError)}
          />
        </FormField>
        <Text style={styles.budgetGoldHint}>
          {t('customer.postTask.budgetGoldHint', 'Set a fair budget to attract skilled Taskers')}
        </Text>
      </View>

      {activePicker ? (
        Platform.OS === 'ios' ? (
          <View style={styles.iosPickerCard} testID="schedule-ios-picker-card">
            <View style={styles.iosPickerHeader}>
              <Text style={styles.iosPickerTitle}>
                {activePicker.mode === 'date'
                  ? t('customer.postTask.scheduleDate', 'Date')
                  : t('customer.postTask.scheduleTime', 'Time')}
              </Text>
              <Text style={styles.iosPickerHint}>
                {t('customer.postTask.schedulePickerHint', 'Confirm your selection')}
              </Text>
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
            <View style={styles.iosPickerActions}>
              <Button
                testID="schedule-picker-cancel"
                label={t('common.cancel', 'Cancel')}
                variant="outline"
                onPress={handlePickerCancel}
                style={styles.iosPickerActionButton}
              />
              <Button
                testID="schedule-picker-confirm"
                label={t('common.confirm', 'Confirm')}
                onPress={handlePickerConfirm}
                style={styles.iosPickerActionButton}
              />
            </View>
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

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  dateCard: {
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    gap: spacing.lg,
    ...elevations.soft,
  },
  dateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateCardTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerField: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerFieldActive: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primaryDeep,
  },
  pickerFieldPressed: {
    opacity: 0.85,
  },
  pickerText: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '600',
  },
  pickerTextActive: {
    color: colors.primaryForeground,
    fontWeight: '700',
  },
  pickerPlaceholder: {
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  budgetSection: {
    gap: spacing.sm,
  },
  budgetHeading: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  budgetGoldHint: {
    fontSize: typography.caption,
    color: colors.secondary,
    fontWeight: '600',
    lineHeight: typography.caption * 1.5,
  },
  iosPickerCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iosPickerHeader: {
    gap: spacing.xs,
  },
  iosPickerTitle: {
    fontSize: typography.label,
    color: colors.primaryDeep,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  iosPickerHint: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  iosPickerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  iosPickerActionButton: {
    flex: 1,
  },
});
