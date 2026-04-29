import { ApiError } from '../lib/api/types';

/**
 * Maximum length for a user-visible error message.
 * Server responses longer than this are almost certainly not user-facing text.
 */
const MAX_USER_ERROR_LENGTH = 200;

/**
 * Patterns that indicate an internal server / infrastructure error
 * rather than a user-facing message.  If ANY pattern matches, the
 * message is replaced with a generic string.
 */
const INTERNAL_PATTERNS = [
  /\.java:\d/, // Java source references (".java:42")
  /\.kt:\d/, // Kotlin source references
  /\.tsx?:\d/, // TypeScript source references
  /\bat\s+[a-z]+\.[a-z]+/, // Stack trace "at com.x.y"
  /Caused by:/, // Java exception chaining
  /\bThrowable\b/, // Java throwable class name
  /\b(SELECT|INSERT|UPDATE|DELETE)\b\s/i, // SQL fragments
  /\{.*"error"/, // JSON error envelopes
];

/**
 * Sanitizes an error message for user display.
 *
 * Prevents internal server details (stack traces, package paths, SQL,
 * JSON fragments) from reaching the UI.  Returns the message as-is
 * when it appears to be a legitimate user-facing string.
 */
function sanitizeErrorMessage(message: string): string {
  const firstLine = message.split('\n')[0]?.trim() ?? '';

  if (firstLine.length === 0 || firstLine.length > MAX_USER_ERROR_LENGTH) {
    return 'Something went wrong. Please try again.';
  }

  const isInternal = INTERNAL_PATTERNS.some((p) => p.test(firstLine));

  return isInternal ? 'Something went wrong. Please try again.' : firstLine;
}

export function parseError(error: unknown): string {
  if (error instanceof ApiError) {
    return sanitizeErrorMessage(error.message);
  }
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message);
  }
  return 'Unexpected error. Please try again.';
}
