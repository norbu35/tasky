import type { CursorPage, PendingReview, Review } from '@/lib/api/types';
import { createMobileApiClient } from '@/lib/mobileApiClient';

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
  return getClient().requestJson<Review>(
    `/bookings/${bookingId}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export async function getMyPendingReviews(accessToken: string): Promise<PendingReview[]> {
  return getClient()
    .requestJson<{ data: PendingReview[] }>('/me/pending-reviews', { method: 'GET' }, accessToken)
    .then((r) => (Array.isArray(r?.data) ? r.data : []));
}

export async function getUserReviews(
  accessToken: string,
  userId: string,
): Promise<CursorPage<Review>> {
  return getClient().requestJson<CursorPage<Review>>(
    `/users/${userId}/reviews`,
    { method: 'GET' },
    accessToken,
    { limit: 100 },
  );
}
