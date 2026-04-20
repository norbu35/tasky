import { createMobileApiClient } from '@/lib/mobileApiClient';
import type { CursorPage, PendingReview, Review } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function submitReview(
  accessToken: string,
  bookingId: string,
  payload: {
    quality_rating?: number;
    punctuality_rating?: number;
    communication_rating?: number;
    clarity_rating?: number;
    respectfulness_rating?: number;
    comment?: string | null;
  },
): Promise<Review> {
  return getClient().submitReview(accessToken, bookingId, payload);
}

export async function getMyPendingReviews(accessToken: string): Promise<PendingReview[]> {
  return getClient().getMyPendingReviews(accessToken);
}

export async function getUserReviews(
  accessToken: string,
  userId: string,
): Promise<CursorPage<Review>> {
  return getClient().getUserReviews(accessToken, userId);
}
