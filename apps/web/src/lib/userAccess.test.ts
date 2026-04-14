import { expect, test, describe } from 'vitest';

import type { Profile } from './apiClient';
import { isRestrictedUser } from './userAccess';

describe('userAccess', () => {
  describe('isRestrictedUser', () => {
    test('returns true for BANNED profile', () => {
      const profile = { status: 'BANNED' } as Profile;
      expect(isRestrictedUser(profile)).toBe(true);
    });

    test('returns true for SUSPENDED profile', () => {
      const profile = { status: 'SUSPENDED' } as Profile;
      expect(isRestrictedUser(profile)).toBe(true);
    });

    test('returns false for ACTIVE/VERIFIED profile', () => {
      const profile = { status: 'VERIFIED' } as Profile;
      expect(isRestrictedUser(profile)).toBe(false);
    });

    test('returns false when profile is null', () => {
      expect(isRestrictedUser(null)).toBe(false);
    });
  });
});
