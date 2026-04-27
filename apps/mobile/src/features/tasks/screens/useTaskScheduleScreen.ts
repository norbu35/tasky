import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const [pricingMode, setPricingMode] = useState<'BUDGET' | 'QUOTE'>(
    draft?.pricingMode ?? 'BUDGET',
  );
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
  const canContinue = isScheduleValid && (pricingMode === 'QUOTE' || isBudgetValid);

  const budgetError =
    pricingMode === 'BUDGET' && touchedBudget && budget !== '' && !isBudgetValid
      ? t('ScheduleBudgetScreen.budgetError')
      : '';
  const scheduleError =
    touchedSchedule && selectedDate && selectedTime && !isScheduleValid
      ? t('ScheduleBudgetScreen.schedulePastError')
      : '';

  const openPicker = (mode: PickerMode) => {
    const fallback = createDefaultScheduleDate();
    setTouchedSchedule(true);
    setActivePicker({
      mode,
      draftDate: toValidDate(selectedDate, fallback),
      draftTime: toValidDate(selectedTime, fallback),
    });
  };

  const handlePickerModeChange = (mode: PickerMode) => {
    setActivePicker((prev) => (prev ? { ...prev, mode } : prev));
  };

  const handlePickerDateChange = (pickedValue: Date) => {
    setActivePicker((prev) => (prev ? { ...prev, draftDate: pickedValue } : prev));
  };

  const handlePickerTimeChange = (pickedValue: Date) => {
    setActivePicker((prev) => (prev ? { ...prev, draftTime: pickedValue } : prev));
  };

  const handlePickerReset = () => {
    const fallback = createDefaultScheduleDate();
    setActivePicker((prev) =>
      prev
        ? {
            ...prev,
            mode: 'date',
            draftDate: fallback,
            draftTime: fallback,
          }
        : prev,
    );
  };

  const handlePickerCancel = () => {
    setActivePicker(null);
  };

  const handlePickerConfirm = () => {
    if (!activePicker) return;
    setSelectedDate(activePicker.draftDate);
    setSelectedTime(activePicker.draftTime);
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
      pricingMode,
      budget: pricingMode === 'BUDGET' ? Number(budget) || 0 : null,
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
    pricingMode,
    budget,
    budgetError,
    scheduleError,
    canContinue,
    openPicker,
    handlePickerModeChange,
    handlePickerDateChange,
    handlePickerTimeChange,
    handlePickerReset,
    handlePickerCancel,
    handlePickerConfirm,
    setPricingMode,
    handleBudgetChange,
    handleBudgetBlur,
    handleNext,
    goBack: () => router.back(),
  };
}
