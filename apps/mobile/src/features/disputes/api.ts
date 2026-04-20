import { createMobileApiClient } from '@/lib/mobileApiClient';
import type { Dispute } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function raiseDispute(
  accessToken: string,
  bookingId: string,
  reason: string,
  idempotencyKey: string,
): Promise<Dispute> {
  return getClient().requestJson<Dispute>(
    `/bookings/${bookingId}/disputes`,
    {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ reason }),
    },
    accessToken,
  );
}

export async function getDispute(accessToken: string, disputeId: string): Promise<Dispute> {
  return getClient().requestJson<Dispute>(`/disputes/${disputeId}`, { method: 'GET' }, accessToken);
}
