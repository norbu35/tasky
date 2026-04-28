import { ApiError } from './apiClient';
import { resolveClientLocale } from './clientAnalytics';
import type { ClientAnalyticsTracker } from './clientAnalytics';

export function parseError(
  error: unknown,
  tracker?: ClientAnalyticsTracker,
  locale = resolveClientLocale(),
): string {
  let message = 'Unexpected error. Please try again.';

  if (error instanceof ApiError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  if (tracker) {
    tracker({
      event_name: 'ERROR_LOGGED',
      platform: 'WEB',
      locale,
      actor_role: 'UNKNOWN',
      error_message: message,
      error_stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  return message;
}
