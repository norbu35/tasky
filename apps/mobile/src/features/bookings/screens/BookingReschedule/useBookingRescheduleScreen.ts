import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useBookingDetail } from '@/features/bookings/hooks/useBookingDetail';
import { useReschedule } from '@/features/bookings/hooks/useReschedule';
import {
  formatDateTime,
  buildCalendarCells,
  getWeekdayLabels,
  type RescheduleState,
} from './model';

export interface BookingRescheduleState {
  bookingId: string;
  selectedDateTime: Date;
  reason: string;
  requestState: RescheduleState;
  tomorrow: Date;
  visibleMonth: Date;
  calendarCells: (Date | null)[];
  weekdayLabels: string[];
  scheduledAtLabel: string;
  isPending: boolean;
  setSelectedDateTime: React.Dispatch<React.SetStateAction<Date>>;
  setReason: React.Dispatch<React.SetStateAction<string>>;
  setRequestState: React.Dispatch<React.SetStateAction<RescheduleState>>;
  updateSelectedTime: (time: string) => void;
  updateSelectedDay: (date: Date) => void;
  handleSubmit: () => Promise<void>;
}

export function useBookingRescheduleScreen(): BookingRescheduleState {
  const { t } = useTranslation();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { mutateAsync: reschedule, isPending } = useReschedule();
  const { data: booking } = useBookingDetail(bookingId);

  const tomorrow = React.useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    return next;
  }, []);

  const [selectedDateTime, setSelectedDateTime] = React.useState<Date>(tomorrow);
  const [reason, setReason] = React.useState('');
  const [requestState, setRequestState] = React.useState<RescheduleState>('request_form');

  const visibleMonth = selectedDateTime;
  const calendarCells = React.useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth]);
  const weekdayLabels = React.useMemo(() => getWeekdayLabels(t), [t]);
  const scheduledAtLabel = booking?.task?.scheduled_at
    ? formatDateTime(booking.task.scheduled_at)
    : t('customer.bookings.scheduleUnavailable');

  const updateSelectedTime = React.useCallback((time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    setSelectedDateTime((current) => {
      const next = new Date(current);
      next.setHours(hours, minutes, 0, 0);
      return next;
    });
  }, []);

  const updateSelectedDay = React.useCallback((date: Date) => {
    setSelectedDateTime((current) => {
      const next = new Date(date);
      next.setHours(current.getHours(), current.getMinutes(), 0, 0);
      return next;
    });
  }, []);

  const handleSubmit = React.useCallback(async () => {
    const idempotencyKey = `reschedule-${bookingId}-${Date.now()}`;
    await reschedule({
      bookingId,
      proposed_scheduled_at: selectedDateTime.toISOString(),
      reason: reason || undefined,
      idempotencyKey,
    });
    setRequestState('awaiting_response');
  }, [bookingId, reason, reschedule, selectedDateTime]);

  return {
    bookingId,
    selectedDateTime,
    reason,
    requestState,
    tomorrow,
    visibleMonth,
    calendarCells,
    weekdayLabels,
    scheduledAtLabel,
    isPending,
    setSelectedDateTime,
    setReason,
    setRequestState,
    updateSelectedTime,
    updateSelectedDay,
    handleSubmit,
  };
}
