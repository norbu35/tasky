/**
 * Web date formatting wrapper.
 *
 * Re-exports all formatters from `@tasky/core/formatDate` with the locale
 * resolved lazily from the current i18n language so the module is safe to
 * import before i18n has initialised.
 */

import i18next from 'i18next';
import type { TFunction } from 'i18next';

import {
  resolveLocale,
  formatDate as coreFormatDate,
  formatTime as coreFormatTime,
  formatDateTime as coreFormatDateTime,
  formatShortDate as coreFormatShortDate,
  formatFullDate as coreFormatFullDate,
  formatFullDateTime as coreFormatFullDateTime,
  formatNumericDate as coreFormatNumericDate,
  formatNumericTime as coreFormatNumericTime,
  getRelativeTimeParts,
} from '@tasky/core/formatDate';

// ---------------------------------------------------------------------------
// Lazy locale helper
// ---------------------------------------------------------------------------

function locale(): string {
  const lang = i18next.language;
  const loc = resolveLocale(lang);
  return loc;
}

// ---------------------------------------------------------------------------
// Absolute formatters (locale auto-resolved)
// ---------------------------------------------------------------------------

export function formatDate(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  return coreFormatDate(value, locale(), options);
}

export function formatTime(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  return coreFormatTime(value, locale(), options);
}

export function formatDateTime(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  return coreFormatDateTime(value, locale(), options);
}

export function formatShortDate(value: string | Date | null | undefined): string {
  return coreFormatShortDate(value, locale());
}

export function formatFullDate(value: string | Date | null | undefined): string {
  return coreFormatFullDate(value, locale());
}

export function formatFullDateTime(value: string | Date | null | undefined): string {
  return coreFormatFullDateTime(value, locale());
}

export function formatNumericDate(value: Date | null | undefined): string {
  return coreFormatNumericDate(value, locale());
}

export function formatNumericTime(value: Date | null | undefined): string {
  return coreFormatNumericTime(value, locale());
}

// ---------------------------------------------------------------------------
// Relative time (i18n-aware)
// ---------------------------------------------------------------------------

export function formatRelativeTime(value: string | Date | null | undefined, t: TFunction): string {
  const parts = getRelativeTimeParts(value);

  switch (parts.type) {
    case 'just_now':
      return t('common.time.justNow');
    case 'minutes':
      return t('common.time.minutesAgo', { count: parts.count });
    case 'hours':
      return t('common.time.hoursAgo', { count: parts.count });
    case 'days':
      return t('common.time.daysAgo', { count: parts.count });
    case 'absolute':
      return coreFormatDateTime(parts.date, locale());
  }
}
