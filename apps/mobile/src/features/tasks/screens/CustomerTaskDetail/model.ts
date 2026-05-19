import type { Task as SdkTask } from '@/lib/api/types';
import i18n from 'i18next';
import { resolveLocale } from '@/utils/formatDate';

export interface CustomerTask extends SdkTask {
  tasker?: {
    id: string;
    full_name?: string;
    avatar_url?: string | null;
    rating_avg?: number;
    is_pro?: boolean;
  };
  applicant_count?: number;
  photo_keys?: string[];
  booking?: { id: string };
}

export function formatBudget(value?: number | null) {
  if (typeof value !== 'number') {
    return '₮0';
  }
  return `₮${value.toLocaleString(resolveLocale(i18n.language))}`;
}

export function formatSchedule(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`;
}

export function prettifyKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAnswerValue(value: unknown, t: (k: string) => string): string {
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return prettifyKey(value);
  if (Array.isArray(value)) return value.map((v) => prettifyKey(String(v))).join(', ');
  return String(value ?? '');
}
