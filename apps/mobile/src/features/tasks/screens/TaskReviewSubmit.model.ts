import { prettifyIntakeToken, type IntakeAnswerSummaryItem } from '@tasky/core';
import i18n from 'i18next';
import { resolveLocale, formatNumericDate, formatTime } from '@/utils/formatDate';

export function formatBudget(amount: string): string {
  const num = Number(amount);
  if (Number.isNaN(num)) return amount;
  return `₮${num.toLocaleString(resolveLocale(i18n.language))}`;
}

export function formatSchedule(scheduledAt?: string): string {
  if (!scheduledAt) {
    return '';
  }

  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    return scheduledAt;
  }

  const date = formatNumericDate(parsed);
  const time = formatTime(parsed);
  return `${date}, ${time}`;
}

export function truncateDescription(text: string, maxLen = 140): string {
  return text.length > maxLen ? `${text.slice(0, maxLen).trimEnd()}...` : text;
}

export function buildFallbackAnswerSummary(
  answers: Record<string, unknown>,
  t: (key: string) => string,
): IntakeAnswerSummaryItem[] {
  return Object.entries(answers)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => {
      const values = Array.isArray(value)
        ? value.map((item) => prettifyIntakeToken(String(item)))
        : [
            typeof value === 'boolean'
              ? value
                ? t('common.yes')
                : t('common.no')
              : typeof value === 'number'
                ? String(value)
                : typeof value === 'string'
                  ? prettifyIntakeToken(value)
                  : String(value ?? ''),
          ].filter(Boolean);

      return {
        key,
        name: key,
        label: prettifyIntakeToken(key),
        values,
      };
    });
}

export function extractTaskId(result: unknown): string | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const candidate = result as {
    id?: unknown;
    task?: { id?: unknown };
    data?: { id?: unknown };
  };

  if (typeof candidate.id === 'string' && candidate.id.length > 0) {
    return candidate.id;
  }

  if (typeof candidate.task?.id === 'string' && candidate.task.id.length > 0) {
    return candidate.task.id;
  }

  if (typeof candidate.data?.id === 'string' && candidate.data.id.length > 0) {
    return candidate.data.id;
  }

  return null;
}

export function isImageUri(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
