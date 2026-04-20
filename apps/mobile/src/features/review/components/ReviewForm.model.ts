import { mobileTheme, withAlpha } from '@/design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

export const STAR_COUNT = 5;
export const COMMENT_MAX_LENGTH = 500;
export const STAR_SIZE = typography.body + spacing.lg / 2;

export interface CategoryRating {
  key: string;
  labelKey: string;
  value: number;
}

export type ReviewRole = 'customer' | 'tasker';

export type ReviewParams = {
  bookingId?: string;
  role?: ReviewRole;
  name?: string;
  avatarUrl?: string;
};

const CUSTOMER_CATEGORIES: CategoryRating[] = [
  { key: 'qualityOfWork', labelKey: 'shared.review.qualityOfWork', value: 0 },
  { key: 'punctuality', labelKey: 'shared.review.punctuality', value: 0 },
  { key: 'communication', labelKey: 'shared.review.communication', value: 0 },
];

const TASKER_CATEGORIES: CategoryRating[] = [
  { key: 'taskDescriptionClarity', labelKey: 'shared.review.taskClarity', value: 0 },
  { key: 'respectfulness', labelKey: 'shared.review.respectfulness', value: 0 },
  { key: 'punctuality', labelKey: 'shared.review.punctuality', value: 0 },
];

export function getCategoryLabel(
  role: ReviewRole,
  categoryKey: string,
  t: (key: string) => string,
) {
  if (role === 'tasker') {
    if (categoryKey === 'taskDescriptionClarity') return t('ReviewFormScreen.copy1');
    if (categoryKey === 'respectfulness') return t('ReviewFormScreen.copy2');
    if (categoryKey === 'punctuality') return t('ReviewFormScreen.copy3');
    return t('ReviewFormScreen.copy4');
  }

  if (categoryKey === 'qualityOfWork') return t('ReviewFormScreen.copy5');
  if (categoryKey === 'punctuality') return t('ReviewFormScreen.copy6');
  if (categoryKey === 'communication') return t('ReviewFormScreen.copy7');
  return t('ReviewFormScreen.copy8');
}

export function createCategories(role: ReviewRole) {
  const base = role === 'tasker' ? TASKER_CATEGORIES : CUSTOMER_CATEGORIES;
  return base.map((category) => ({ ...category }));
}

export function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export { colors, radius, spacing, typography, withAlpha };
