/**
 * Cross-platform date formatting utilities.
 *
 * All functions are locale-parametric: the app layer injects the resolved
 * BCP-47 locale (e.g. `mn-MN` or `en-US`) derived from the current i18n language.
 * No i18n imports here — packages/core stays platform-agnostic.
 *
 * Wire-up pattern:
 *   packages/core  → locale-parametric functions (this file)
 *   apps/web       → thin wrapper resolving locale from `i18n.language`
 *   apps/mobile    → thin wrapper resolving locale from `i18n.language`
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map app-language code to BCP-47 locale for Intl APIs. */
export function resolveLocale(lang: string): string {
  return lang === 'en' ? 'en-US' : 'mn-MN';
}

/** Safely coerce a value to a valid `Date`, or `null`. */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

// ---------------------------------------------------------------------------
// Mongolian locale override
// ---------------------------------------------------------------------------

const MN_MONTHS_NOMINATIVE = [
  '1-р сар',
  '2-р сар',
  '3-р сар',
  '4-р сар',
  '5-р сар',
  '6-р сар',
  '7-р сар',
  '8-р сар',
  '9-р сар',
  '10-р сар',
  '11-р сар',
  '12-р сар',
];

const MN_MONTHS_GENITIVE = [
  '1-р сарын',
  '2-р сарын',
  '3-р сарын',
  '4-р сарын',
  '5-р сарын',
  '6-р сарын',
  '7-р сарын',
  '8-р сарын',
  '9-р сарын',
  '10-р сарын',
  '11-р сарын',
  '12-р сарын',
];

/** Sunday=0, Monday=1 … Saturday=6 */
const MN_WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

function isMnLocale(locale: string): boolean {
  return locale === 'mn' || locale === 'mn-MN';
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Custom Mongolian date/time formatter.
 * Handles the options that the public functions actually pass.
 */
function formatMnDate(d: Date, options?: Intl.DateTimeFormatOptions): string {
  const y = d.getFullYear();
  const mo = d.getMonth();
  const day = d.getDate();
  const wd = d.getDay();
  const h = d.getHours();
  const m = d.getMinutes();

  const hasYear = options?.year != null;
  const hasMonth = options?.month != null;
  const hasDay = options?.day != null;
  const hasWeekday = options?.weekday != null;
  const hasHour = options?.hour != null;
  const hasMinute = options?.minute != null;

  const monthIsLong = options?.month === 'long';
  const monthIsShort = options?.month === 'short';
  const useGenitive = monthIsLong || (monthIsShort && (hasYear || hasDay));
  const monthLabel = useGenitive ? MN_MONTHS_GENITIVE[mo]! : MN_MONTHS_NOMINATIVE[mo]!;
  const monthNum = mo + 1;

  const parts: string[] = [];

  // Date portion
  const monthIsNumeric = options?.month === '2-digit' || options?.month === 'numeric';
  if (hasYear && hasMonth && hasDay) {
    if (monthIsNumeric) {
      // Compact numeric: "2026.04.15"
      parts.push(`${y}.${pad2(monthNum)}.${pad2(day)}`);
    } else {
      // Verbose: "2026 оны 4-р сарын 15"
      parts.push(`${y} оны ${monthNum}-р сарын ${pad2(day)}`);
    }
  } else if (hasYear && hasMonth) {
    parts.push(`${y} оны ${monthLabel}`);
  } else if (hasYear && hasDay) {
    parts.push(`${pad2(day)}/${pad2(monthNum)}/${y}`);
  } else if (hasMonth && hasDay) {
    // "M-р сар DD" (short date)
    parts.push(`${monthNum}-р сар ${pad2(day)}`);
  } else if (hasYear) {
    parts.push(String(y));
  } else if (hasMonth) {
    parts.push(monthLabel);
  } else if (hasDay) {
    parts.push(String(day));
  }

  if (hasWeekday) {
    parts.push(MN_WEEKDAYS[wd]!);
  }

  // Time portion
  if (hasHour) {
    parts.push(`${pad2(h)}:${pad2(m)}`);
  } else if (hasMinute) {
    parts.push(String(m));
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Absolute formatters
// ---------------------------------------------------------------------------

/** Locale-aware date only (e.g. "2026.04.15" / "Apr 15, 2026"). */
export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = toDate(value);
  if (!d) return '';
  if (isMnLocale(locale)) {
    return formatMnDate(d, { year: 'numeric', month: '2-digit', day: '2-digit', ...options });
  }
  return d.toLocaleDateString(locale, options);
}

/** Locale-aware time only (24-hour by default, e.g. "14:30"). */
export function formatTime(
  value: string | Date | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = toDate(value);
  if (!d) return '';
  if (isMnLocale(locale)) {
    return formatMnDate(d, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options,
    });
  }
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}

/** Locale-aware date + time (e.g. "2026.04.15 14:30" / "Apr 15, 2026, 2:30 PM"). */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = toDate(value);
  if (!d) return '';
  if (isMnLocale(locale)) {
    return formatMnDate(d, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });
  }
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/** Compact date for feed cards / lists (e.g. "4-р сар 15" / "Apr 15"). */
export function formatShortDate(value: string | Date | null | undefined, locale: string): string {
  if (isMnLocale(locale)) {
    const d = toDate(value);
    if (!d) return '';
    return formatMnDate(d, { month: 'short', day: 'numeric' });
  }
  return formatDate(value, locale, { month: 'short', day: 'numeric' });
}

/** Full date with weekday for detail screens. */
export function formatFullDate(value: string | Date | null | undefined, locale: string): string {
  if (isMnLocale(locale)) {
    const d = toDate(value);
    if (!d) return '';
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    const wd = d.getDay();
    return `${y} оны ${mo}-р сарын ${pad2(day)}, ${MN_WEEKDAYS[wd]!}`;
  }
  return formatDate(value, locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Full date + time with weekday for detail screens. */
export function formatFullDateTime(
  value: string | Date | null | undefined,
  locale: string,
): string {
  if (isMnLocale(locale)) {
    const d = toDate(value);
    if (!d) return '';
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    const wd = d.getDay();
    const h = d.getHours();
    const m = d.getMinutes();
    return `${y} оны ${mo}-р сарын ${pad2(day)} ${MN_WEEKDAYS[wd]} ${pad2(h)}:${pad2(m)}`;
  }
  return formatDateTime(value, locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Numeric date for picker / compact display.
 * Produces "2026.04.15" for mn-MN, "04/15/2026" for en-US, etc.
 */
export function formatNumericDate(value: Date | null | undefined, locale: string): string {
  if (!value) return '';
  if (isMnLocale(locale)) {
    const y = value.getFullYear();
    const mo = value.getMonth() + 1;
    const d = value.getDate();
    return `${y}.${pad2(mo)}.${pad2(d)}`;
  }
  return value.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Numeric time for picker display (HH:mm, 24-hour).
 * Locale-independent format since time pickers use 24h in both en/mn.
 */
export function formatNumericTime(value: Date | null | undefined, locale: string): string {
  if (!value) return '';
  if (isMnLocale(locale)) {
    return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
  }
  return value.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

/** Discriminated parts returned by `getRelativeTimeParts`. */
export type RelativeTimeParts =
  | { type: 'just_now' }
  | { type: 'minutes'; count: number }
  | { type: 'hours'; count: number }
  | { type: 'days'; count: number }
  | { type: 'absolute'; date: Date };

/**
 * Compute the relative time difference from now.
 * Platform wrappers use the result to pick the right i18n key.
 *
 * @param thresholdHours — switch to absolute date after this many hours (default 24)
 */
export function getRelativeTimeParts(
  value: string | Date | null | undefined,
  thresholdHours = 24,
): RelativeTimeParts {
  const d = toDate(value);
  if (!d) return { type: 'just_now' };

  const diffMs = Math.max(0, Date.now() - d.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return { type: 'just_now' };
  if (diffMinutes < 60) return { type: 'minutes', count: diffMinutes };

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < thresholdHours) return { type: 'hours', count: diffHours };

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return { type: 'days', count: diffDays };

  return { type: 'absolute', date: d };
}
