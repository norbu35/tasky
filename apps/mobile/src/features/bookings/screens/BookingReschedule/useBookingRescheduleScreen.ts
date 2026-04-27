import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useBookingDetail } from '@/features/bookings/hooks/useBookingDetail';
import { useReschedule } from '@/features/bookings/hooks/useReschedule';

import {
  type ActivePickerState,
  type PickerMode,
  type RescheduleState,
  combineDateAndTime,
  createDefaultRescheduleDate,
  formatDateTime,
  toValidDate,
} from './model';

export interface BookingRescheduleState {
  bookingId: string;
  selectedDate: Date;
  selectedTime: Date;
  selectedDateTime: Date;
  activePicker: ActivePickerState;
  reason: string;
  requestState: RescheduleState;
  scheduledAtLabel: string;
  submitError: string;
  isPending: boolean;
  setReason: React.Dispatch<React.SetStateAction<string>>;
  openPicker: (mode: PickerMode) => void;
  handlePickerModeChange: (mode: PickerMode) => void;
  handlePickerDateChange: (pickedValue: Date) => void;
  handlePickerTimeChange: (pickedValue: Date) => void;
  handlePickerReset: () => void;
  handlePickerCancel: () => void;
  handlePickerConfirm: () => void;
  handleSubmit: () => Promise<void>;
}

export function useBookingRescheduleScreen(): BookingRescheduleState {
  const { t } = useTranslation();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { mutateAsync: reschedule, isPending } = useReschedule();
  const { data: booking } = useBookingDetail(bookingId);

  const defaultDate = React.useMemo(() => createDefaultRescheduleDate(), []);
  const [selectedDate, setSelectedDate] = React.useState<Date>(defaultDate);
  const [selectedTime, setSelectedTime] = React.useState<Date>(defaultDate);
  const [activePicker, setActivePicker] = React.useState<ActivePickerState>(null);
  const [reason, setReason] = React.useState('');
  const [requestState, setRequestState] = React.useState<RescheduleState>('request_form');
  const [submitError, setSubmitError] = React.useState('');

  const selectedDateTime = React.useMemo(
    () => combineDateAndTime(selectedDate, selectedTime),
    [selectedDate, selectedTime],
  );

  const currentScheduledAt = booking?.confirmed_scheduled_at ?? booking?.task?.scheduled_at;
  const scheduledAtLabel = currentScheduledAt
    ? formatDateTime(currentScheduledAt)
    : t('customer.bookings.scheduleUnavailable');

  const openPicker = React.useCallback(
    (mode: PickerMode) => {
      const fallback = createDefaultRescheduleDate();
      setSubmitError('');
      setActivePicker({
        mode,
        draftDate: toValidDate(selectedDate, fallback),
        draftTime: toValidDate(selectedTime, fallback),
      });
    },
    [selectedDate, selectedTime],
  );

  const handlePickerModeChange = React.useCallback((mode: PickerMode) => {
    setActivePicker((prev) => (prev ? { ...prev, mode } : prev));
  }, []);

  const handlePickerDateChange = React.useCallback((pickedValue: Date) => {
    setActivePicker((prev) => (prev ? { ...prev, draftDate: pickedValue } : prev));
  }, []);

  const handlePickerTimeChange = React.useCallback((pickedValue: Date) => {
    setActivePicker((prev) => (prev ? { ...prev, draftTime: pickedValue } : prev));
  }, []);

  const handlePickerReset = React.useCallback(() => {
    const fallback = createDefaultRescheduleDate();
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
  }, []);

  const handlePickerCancel = React.useCallback(() => {
    setActivePicker(null);
  }, []);

  const handlePickerConfirm = React.useCallback(() => {
    if (!activePicker) return;
    setSelectedDate(activePicker.draftDate);
    setSelectedTime(activePicker.draftTime);
    setActivePicker(null);
  }, [activePicker]);

  const handleSubmit = React.useCallback(async () => {
    const idempotencyKey = `reschedule-${bookingId}-${Date.now()}`;
    setSubmitError('');
    try {
      await reschedule({
        bookingId,
        proposed_scheduled_at: selectedDateTime.toISOString(),
        reason: reason || undefined,
        idempotencyKey,
      });
      setRequestState('awaiting_response');
    } catch {
      setSubmitError(t('customer.bookings.rescheduleSubmitError'));
    }
  }, [bookingId, reason, reschedule, selectedDateTime, t]);

  return {
    bookingId,
    selectedDate,
    selectedTime,
    selectedDateTime,
    activePicker,
    reason,
    requestState,
    scheduledAtLabel,
    submitError,
    isPending,
    setReason,
    openPicker,
    handlePickerModeChange,
    handlePickerDateChange,
    handlePickerTimeChange,
    handlePickerReset,
    handlePickerCancel,
    handlePickerConfirm,
    handleSubmit,
  };
}
