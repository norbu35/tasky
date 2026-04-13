import i18n from 'i18next';

/**
 * Format a date string using the current app locale.
 * Respects the user's language preference (mn-MN or en-US).
 */
export function formatDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';

  const locale = i18n.language === 'mn' ? 'mn-MN' : 'en-US';
  return date.toLocaleDateString(locale, options);
}

/**
 * Format a date with time for display in task cards and detail screens.
 */
export function formatDateTime(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatDate(value, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Format a short date for compact display (e.g., feed cards).
 */
export function formatShortDate(value: string | Date): string {
  return formatDate(value, { month: 'short', day: 'numeric' });
}

/**
 * Format a full date for detail screens.
 */
export function formatFullDate(value: string | Date): string {
  return formatDate(value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
