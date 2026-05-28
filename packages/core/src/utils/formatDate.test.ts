import { describe, expect, it, vi } from 'vitest';

import { formatNumericDate, getRelativeTimeParts, resolveLocale, toDate } from './formatDate';

describe('core formatDate utilities', () => {
  it('maps app language codes to Intl locales', () => {
    expect(resolveLocale('en')).toBe('en-US');
    expect(resolveLocale('mn')).toBe('mn-MN');
  });

  it('coerces valid dates and rejects invalid input', () => {
    expect(toDate('2026-04-15T10:00:00Z')).toBeInstanceOf(Date);
    expect(toDate('not-a-date')).toBeNull();
    expect(toDate(null)).toBeNull();
  });

  it('formats Mongolian numeric dates without relying on Intl availability', () => {
    expect(formatNumericDate(new Date(2026, 3, 5), 'mn-MN')).toBe('2026.04.05');
  });

  it('classifies relative time into stable buckets', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'));

    expect(getRelativeTimeParts('2026-04-15T11:55:00Z')).toEqual({
      type: 'minutes',
      count: 5,
    });
    expect(getRelativeTimeParts('2026-04-15T09:00:00Z')).toEqual({
      type: 'hours',
      count: 3,
    });

    vi.useRealTimers();
  });
});
