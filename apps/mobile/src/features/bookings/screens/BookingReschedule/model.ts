export const RESCHEDULE_SURFACE = {
  currentScheduleIconBox: 34,
  stepBadge: 32,
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

export type PickerMode = 'date' | 'time';

export type ActivePickerState = {
  mode: PickerMode;
  draftDate: Date;
  draftTime: Date;
} | null;

export function createDefaultRescheduleDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
}

export function createRescheduleDateOptions(referenceDate = new Date(), days = 30): Date[] {
  const firstDate = new Date(referenceDate);
  firstDate.setDate(firstDate.getDate() + 1);
  firstDate.setHours(10, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const option = new Date(firstDate);
    option.setDate(firstDate.getDate() + index);
    return option;
  });
}

export function createRescheduleTimeOptions(referenceDate = createDefaultRescheduleDate()): Date[] {
  const options: Date[] = [];
  for (let hour = 8; hour <= 21; hour += 1) {
    for (const minute of [0, 30]) {
      const option = new Date(referenceDate);
      option.setHours(hour, minute, 0, 0);
      options.push(option);
    }
  }
  return options;
}

export function combineDateAndTime(dateValue: Date, timeValue: Date): Date {
  const combined = new Date(dateValue);
  combined.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
  return combined;
}

export function toValidDate(value: Date | null | undefined, fallback: Date): Date {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }
  return fallback;
}
