import { createMobileApiClient } from '@/lib/mobileApiClient';
import type {
  Booking,
  BookingFilters,
  BookingIntent,
  BookingScheduleEvent,
  CursorPage,
} from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function listBookings(
  accessToken: string,
  filters?: BookingFilters,
): Promise<CursorPage<Booking>> {
  return getClient().listBookings(accessToken, filters);
}

export async function getBooking(accessToken: string, bookingId: string): Promise<Booking> {
  return getClient().getBooking(accessToken, bookingId);
}

export async function cancelBooking(
  accessToken: string,
  bookingId: string,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().cancelBooking(accessToken, bookingId, idempotencyKey);
}

export async function completeBooking(
  accessToken: string,
  bookingId: string,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().completeBooking(accessToken, bookingId, idempotencyKey);
}

export async function markBookingDone(
  accessToken: string,
  bookingId: string,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().markBookingDone(accessToken, bookingId, idempotencyKey);
}

export async function rescheduleBooking(
  accessToken: string,
  bookingId: string,
  payload: { proposed_scheduled_at: string; reason?: string },
  idempotencyKey: string,
): Promise<BookingScheduleEvent> {
  return getClient().rescheduleBooking(accessToken, bookingId, payload, idempotencyKey);
}

export async function acceptApplication(
  accessToken: string,
  taskId: string,
  applicationId: string,
  liabilityDisclaimerAccepted: boolean,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().acceptApplication(
    accessToken,
    taskId,
    applicationId,
    liabilityDisclaimerAccepted,
    idempotencyKey,
  );
}

export async function createBookingIntent(
  accessToken: string,
  taskId: string,
  source: 'REBOOK' | 'INSTANT_MATCH',
  taskerId: string,
  originalBookingId?: string,
  offerId?: string,
): Promise<BookingIntent> {
  return getClient().createBookingIntent(
    accessToken,
    taskId,
    source,
    taskerId,
    originalBookingId,
    offerId,
  );
}

export async function confirmBookingIntent(
  accessToken: string,
  bookingIntentId: string,
  liabilityDisclaimerAccepted: boolean,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().confirmBookingIntent(
    accessToken,
    bookingIntentId,
    liabilityDisclaimerAccepted,
    idempotencyKey,
  );
}

export async function flagNoShow(accessToken: string, bookingId: string): Promise<void> {
  return getClient().flagNoShow(accessToken, bookingId);
}

export async function getBookingTimeline(
  accessToken: string,
  bookingId: string,
): Promise<
  {
    event: string;
    timestamp: string;
    actor: string;
    description?: string;
  }[]
> {
  return getClient().getBookingTimeline(accessToken, bookingId);
}
