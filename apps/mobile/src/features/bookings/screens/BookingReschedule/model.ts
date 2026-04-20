export const RESCHEDULE_SURFACE = {
  navIconBox: 32,
  currentScheduleIconBox: 34,
  stepBadge: 32,
  calendarCellWidth: '14.2857%',
  calendarNavIcon: 20,
  timeChipMinWidth: 72,
  timeChipMinHeight: 40,
  reasonMinHeight: 120,
  reasonInputMinHeight: 96,
  stateIconBox: 40,
  ctaHeight: 56,
} as const;

export type RescheduleState =
  | 'request_form'
  | 'awaiting_response'
  | 'accepted'
  | 'declined'
  | 'expired';

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

export function formatMonthTitle(date: Date): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year} оны ${month}-р сар`;
}

export function buildCalendarCells(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, index) => {
    if (index < offset || index >= offset + daysInMonth) return null;
    return new Date(year, month, index - offset + 1);
  });
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getWeekdayLabels(t: (key: string) => string) {
  return [
    t('customer.bookings.weekdays.mon'),
    t('customer.bookings.weekdays.tue'),
    t('customer.bookings.weekdays.wed'),
    t('customer.bookings.weekdays.thu'),
    t('customer.bookings.weekdays.fri'),
    t('customer.bookings.weekdays.sat'),
    t('customer.bookings.weekdays.sun'),
  ];
}

export const AVAILABLE_TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00'] as const;

export function isTimeSelected(selectedDateTime: Date, time: string): boolean {
  const formatted = formatDateTime(selectedDateTime);
  return formatted.endsWith(` ${time}`);
}
