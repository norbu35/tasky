import type { TaskDraft } from './taskDraft.types';

export function isStep0Valid(draft: TaskDraft | undefined): boolean {
  return Boolean(draft?.categoryId);
}

export function isStep1Valid(draft: TaskDraft | undefined): boolean {
  return Boolean(draft?.description?.trim());
}

export function isStep2Valid(draft: TaskDraft | undefined): boolean {
  return Array.isArray(draft?.photos);
}

export function isStep3Valid(draft: TaskDraft | undefined): boolean {
  return (
    draft?.location != null &&
    typeof draft.location.lat === 'number' &&
    typeof draft.location.lng === 'number' &&
    Number.isFinite(draft.location.lat) &&
    Number.isFinite(draft.location.lng)
  );
}

export function isStep4Valid(draft: TaskDraft | undefined): boolean {
  if (!draft?.scheduledAt) {
    return false;
  }

  if (draft.pricingMode === 'QUOTE') {
    return true;
  }

  return draft?.budget != null && draft.budget > 0;
}

export function isDraftComplete(draft: TaskDraft | undefined): boolean {
  return (
    isStep0Valid(draft) &&
    isStep1Valid(draft) &&
    isStep2Valid(draft) &&
    isStep3Valid(draft) &&
    isStep4Valid(draft)
  );
}
