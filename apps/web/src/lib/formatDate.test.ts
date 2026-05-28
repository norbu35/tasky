import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

import { formatRelativeTime, formatShortDate } from './formatDate';

describe('web formatDate wrapper', () => {
  afterEach(async () => {
    await i18next.changeLanguage('en');
  });

  it('resolves English formatting from the active i18n language', async () => {
    await i18next.changeLanguage('en');

    expect(formatShortDate(new Date(2026, 3, 15))).toContain('Apr');
  });

  it('resolves Mongolian formatting from the active i18n language', async () => {
    await i18next.changeLanguage('mn');

    expect(formatShortDate(new Date(2026, 3, 15))).toBe('4-р сар 15');
  });

  it('uses caller-provided translations for relative time labels', () => {
    const t = (key: string, options?: { count?: number }) =>
      options?.count == null ? key : `${key}:${options.count}`;

    expect(formatRelativeTime(new Date(Date.now() - 2 * 60_000), t as never)).toBe(
      'common.time.minutesAgo:2',
    );
  });
});
