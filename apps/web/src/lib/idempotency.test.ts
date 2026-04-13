import { expect, test, describe } from 'vitest';
import { createIdempotencyKey } from './idempotency';

describe('idempotency', () => {
  describe('createIdempotencyKey', () => {
    test('returns string starting with prefix', () => {
      const key = createIdempotencyKey('booking');
      expect(key.startsWith('booking-')).toBe(true);
    });

    test('returns unique keys', () => {
      const k1 = createIdempotencyKey('test');
      const k2 = createIdempotencyKey('test');
      expect(k1).not.toBe(k2);
    });
  });
});
