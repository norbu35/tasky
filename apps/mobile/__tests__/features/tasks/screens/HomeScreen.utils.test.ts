import { isWithinScheduleWindow, startOfDay } from '@/features/tasks/screens/HomeScreen.utils';

describe('HomeScreen.utils', () => {
  describe('startOfDay', () => {
    it('strips time components to midnight', () => {
      const date = new Date('2025-06-15T14:30:45.123Z');
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('isWithinScheduleWindow', () => {
    const today = new Date();
    const todayISO = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0,
    ).toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      12,
      0,
      0,
    ).toISOString();

    it('returns true for "any" window regardless of date', () => {
      expect(isWithinScheduleWindow('2020-01-01T00:00:00Z', 'any')).toBe(true);
    });

    it('matches today for "today" window', () => {
      expect(isWithinScheduleWindow(todayISO, 'today')).toBe(true);
    });

    it('excludes tomorrow from "today" window', () => {
      expect(isWithinScheduleWindow(tomorrowISO, 'today')).toBe(false);
    });

    it('matches tomorrow for "tomorrow" window', () => {
      expect(isWithinScheduleWindow(tomorrowISO, 'tomorrow')).toBe(true);
    });

    it('excludes today from "tomorrow" window', () => {
      expect(isWithinScheduleWindow(todayISO, 'tomorrow')).toBe(false);
    });

    it('includes today in "this-week" window', () => {
      expect(isWithinScheduleWindow(todayISO, 'this-week')).toBe(true);
    });

    it('includes tomorrow in "this-week" window', () => {
      expect(isWithinScheduleWindow(tomorrowISO, 'this-week')).toBe(true);
    });

    it('returns true for invalid dates (graceful fallback)', () => {
      expect(isWithinScheduleWindow('not-a-date', 'today')).toBe(true);
    });
  });
});
