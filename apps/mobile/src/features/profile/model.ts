export const MIN_PUBLIC_REVIEW_COUNT = 3;

export function canShowPublicRating(reviewCount?: number | null, rating?: number | null): boolean {
  return (reviewCount ?? 0) >= MIN_PUBLIC_REVIEW_COUNT && (rating ?? 0) > 0;
}

export function formatPublicRating(rating?: number | null): string {
  return (rating ?? 0).toFixed(1);
}

export function getReviewThresholdRemaining(reviewCount?: number | null): number {
  return Math.max(0, MIN_PUBLIC_REVIEW_COUNT - (reviewCount ?? 0));
}
