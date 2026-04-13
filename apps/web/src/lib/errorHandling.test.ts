import { expect, test, describe, vi } from 'vitest';
import { parseError } from './errorHandling';
import { ApiError } from './apiClient';
import type { ClientAnalyticsTracker } from './clientAnalytics';

describe('errorHandling', () => {
  describe('parseError', () => {
    test('extracts message from ApiError', () => {
      const error = new ApiError(400, 'API failed');
      expect(parseError(error)).toBe('API failed');
    });

    test('extracts message from Error', () => {
      const error = new Error('Generic error');
      expect(parseError(error)).toBe('Generic error');
    });

    test('returns fallback for unknown error type', () => {
      expect(parseError('Unknown')).toBe('Unexpected error. Please try again.');
      expect(parseError(null)).toBe('Unexpected error. Please try again.');
    });

    test('tracks error event if tracker provided', () => {
      const tracker = vi.fn() as ClientAnalyticsTracker;
      const error = new Error('Test error');

      parseError(error, tracker);

      expect(tracker).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'ERROR_LOGGED',
          error_message: 'Test error',
          platform: 'WEB',
        }),
      );
    });
  });
});
