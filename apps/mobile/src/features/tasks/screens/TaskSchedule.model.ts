export const MIN_BUDGET = 20000;

export type PickerMode = 'date' | 'time';
export type ActivePickerState = {
  mode: PickerMode;
  draftDate: Date;
  draftTime: Date;
} | null;

export function createDefaultScheduleDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
}

export function createScheduleDateOptions(referenceDate = new Date(), days = 30): Date[] {
  const firstDate = new Date(referenceDate);
  firstDate.setDate(firstDate.getDate() + 1);
  firstDate.setHours(10, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const option = new Date(firstDate);
    option.setDate(firstDate.getDate() + index);
    return option;
  });
}

export function createScheduleTimeOptions(referenceDate = createDefaultScheduleDate()): Date[] {
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

export function isSameScheduleDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameScheduleTime(a: Date, b: Date): boolean {
  return a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();
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

export function parseDateParam(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}
