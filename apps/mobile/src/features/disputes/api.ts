import { createMobileApiClient } from '@/lib/mobileApiClient';
import type { Dispute } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function raiseDispute(
  accessToken: string,
  bookingId: string,
  reason: string,
  idempotencyKey: string,
): Promise<Dispute> {
  return getClient().raiseDispute(accessToken, bookingId, reason, idempotencyKey);
}

export async function getDispute(accessToken: string, disputeId: string): Promise<Dispute> {
  return getClient().getDispute(accessToken, disputeId);
}
