import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useTaskDraftStore } from '@/features/tasks/draft';

import {
  MIN_BUDGET,
  type ActivePickerState,
  type PickerMode,
  combineDateAndTime,
  createDefaultScheduleDate,
  parseDateParam,
  toValidDate,
} from './TaskSchedule.model';

export function useTaskScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const draft = useTaskDraftStore((s) => s.drafts[draftId]);
  const updateDraft = useTaskDraftStore((s) => s.updateDraft);

  const parsedSchedule = parseDateParam(draft?.scheduledAt);
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsedSchedule);
  const [selectedTime, setSelectedTime] = useState<Date | null>(parsedSchedule);
  const [activePicker, setActivePicker] = useState<ActivePickerState>(null);
  const [budget, setBudget] = useState(draft?.budget != null ? String(draft.budget) : '');
  const [touchedBudget, setTouchedBudget] = useState(false);
  const [touchedSchedule, setTouchedSchedule] = useState(false);

  const schedule = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
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
    if (!activePicker) return;
    if (activePicker.mode === 'date') {
      setSelectedDate(activePicker.draftValue);
    } else {
      setSelectedTime(activePicker.draftValue);
    }
    setActivePicker(null);
  };

  const handleBudgetChange = (text: string) => {
    setBudget(text);
    setTouchedBudget(true);
  };

  const handleBudgetBlur = () => {
    setTouchedBudget(true);
  };

  const handleNext = () => {
    if (!canContinue || !schedule || schedule.getTime() <= Date.now()) return;
    updateDraft(draftId, {
      scheduledAt: schedule.toISOString(),
      budget: Number(budget) || 0,
      currentStep: 4,
    });
    router.push({
      pathname: '/(customer)/tasks/new/review',
      params: { draftId },
    });
  };

  return {
    selectedDate,
    selectedTime,
    activePicker,
    budget,
    budgetError,
    scheduleError,
    canContinue,
    openPicker,
    handlePickerChange,
    handlePickerCancel,
    handlePickerConfirm,
    handleBudgetChange,
    handleBudgetBlur,
    handleNext,
    goBack: () => router.back(),
  };
}
