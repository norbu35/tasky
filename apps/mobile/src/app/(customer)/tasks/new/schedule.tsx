import React, { useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock3 } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme } from '../../../../design/tokenAdapter';

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
  const [activePicker, setActivePicker] = useState<ActivePickerState>(null);
  const [budget, setBudget] = useState('');
  const [touchedBudget, setTouchedBudget] = useState(false);
  const [touchedSchedule, setTouchedSchedule] = useState(false);

  const schedule = useMemo(() => {
    if (!selectedDate || !selectedTime) {
      return null;
    }
    return combineDateAndTime(selectedDate, selectedTime);
  }, [selectedDate, selectedTime]);

  const budgetNumber = Number(budget);
  const isBudgetValid = budget !== '' && Number.isFinite(budgetNumber) && budgetNumber >= MIN_BUDGET;
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
      mode === 'date'
        ? toValidDate(selectedDate, fallback)
        : toValidDate(selectedTime, fallback);
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
        <Text style={styles.stepLabel}>{t('taskPost.step', 'Step {{current}} of {{total}}').replace('{{current}}', '5').replace('{{total}}', '7')}</Text>
        <Text style={styles.title}>{t('customer.postTask.schedulePageTitle', 'Schedule & Budget')}</Text>
        <Text style={styles.subtitle}>
          {t('customer.postTask.scheduleInstruction', 'Pick when the task should happen and set your budget.')}
        </Text>
      </View>

      <View style={styles.dateCard}>
        <View style={styles.dateCardHeader}>
          <CalendarDays size={18} color={colors.primary} />
          <Text style={styles.dateCardTitle}>{t('customer.postTask.scheduleLabel', 'When do you need this done?')}</Text>
        </View>

        <FormField
          label={t('customer.postTask.scheduleDate', 'Date')}
          errorText={scheduleError || undefined}
          helperText={t('customer.postTask.scheduleHelper', 'Select a date and time')}
        >
          <View style={styles.scheduleRow}>
            <Pressable
              onPress={() => openPicker('date')}
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
              onPress={() => openPicker('time')}
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
            'Enter a fixed amount. Minimum: ₮1,001',
          )}
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
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Clock3 size={16} color={colors.primaryDeep} />
          <Text style={styles.summaryText}>
            {schedule
              ? `${formatDateValue(schedule)} · ${formatTimeValue(schedule)}`
              : t('customer.postTask.scheduleSummary', 'Choose a date and time')}
          </Text>
        </View>
        <Text style={styles.summaryNote}>
          {t(
            'customer.postTask.scheduleNote',
            'Date format uses YYYY.MM.DD and budget is shown in tugrik.',
          )}
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
              testID={activePicker.mode === 'date' ? 'schedule-date-picker' : 'schedule-time-picker'}
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
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  dateCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
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
  pickerFieldPressed: {
    opacity: 0.85,
  },
  pickerText: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '600',
  },
  pickerPlaceholder: {
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: `${colors.primary}0F`,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  summaryNote: {
    fontSize: typography.caption,
    color: colors.textSecondary,
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
