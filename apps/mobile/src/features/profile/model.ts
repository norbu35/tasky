export const MIN_PUBLIC_REVIEW_COUNT = 3;

export function canShowPublicRating(
  completedTasks?: number | null,
  rating?: number | null,
): boolean {
  return (completedTasks ?? 0) >= MIN_PUBLIC_REVIEW_COUNT && (rating ?? 0) > 0;
}

export function formatPublicRating(rating?: number | null): string {
  return (rating ?? 0).toFixed(1);
}

export function getReviewThresholdRemaining(completedTasks?: number | null): number {
  return Math.max(0, MIN_PUBLIC_REVIEW_COUNT - (completedTasks ?? 0));
}
