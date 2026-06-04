import type {
  Booking,
  BookingFilters,
  BookingIntent,
  BookingScheduleEvent,
  CursorPage,
} from '@/lib/api/types';
import { createMobileApiClient } from '@/lib/mobileApiClient';

const getClient = () => createMobileApiClient();

function mapBookingScheduleEventType(eventType: BookingScheduleEvent['event_type']): string {
  switch (eventType) {
    case 'REQUESTED':
      return 'reschedule_requested';
    case 'ACCEPTED':
      return 'reschedule_accepted';
    case 'DECLINED':
      return 'reschedule_declined';
    case 'EXPIRED':
      return 'reschedule_expired';
    default:
      return String(eventType).toLowerCase();
  }
}

export async function listBookings(
  accessToken: string,
  filters?: BookingFilters,
): Promise<CursorPage<Booking>> {
  return getClient().requestJson<CursorPage<Booking>>('/bookings', { method: 'GET' }, accessToken, {
    role: filters?.role,
    status: filters?.status,
    limit: 100,
  });
}

export async function getBooking(accessToken: string, bookingId: string): Promise<Booking> {
  return getClient().requestJson<Booking>(`/bookings/${bookingId}`, { method: 'GET' }, accessToken);
}

export async function cancelBooking(
  accessToken: string,
  bookingId: string,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().requestJson<Booking>(
    `/bookings/${bookingId}/cancel`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    accessToken,
  );
}

export async function completeBooking(
  accessToken: string,
  bookingId: string,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().requestJson<Booking>(
    `/bookings/${bookingId}/complete`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    accessToken,
  );
}

export async function markBookingDone(
  accessToken: string,
  bookingId: string,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().requestJson<Booking>(
    `/bookings/${bookingId}/mark-done`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    accessToken,
  );
}

export async function rescheduleBooking(
  accessToken: string,
  bookingId: string,
  payload: { proposed_scheduled_at: string; reason?: string },
  idempotencyKey: string,
): Promise<BookingScheduleEvent> {
  return getClient().requestJson<BookingScheduleEvent>(
    `/bookings/${bookingId}/reschedule`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export async function acceptApplication(
  accessToken: string,
  taskId: string,
  applicationId: string,
  liabilityDisclaimerAccepted: boolean,
  idempotencyKey: string,
): Promise<BookingIntent> {
  return getClient().requestJson<BookingIntent>(
    `/tasks/${taskId}/applications/${applicationId}/accept`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ liability_disclaimer_accepted: liabilityDisclaimerAccepted }),
    },
    accessToken,
  );
}

export async function createBookingIntent(
  accessToken: string,
  taskId: string,
  source: 'REBOOK',
  taskerId: string,
  idempotencyKey: string,
  originalBookingId?: string,
): Promise<BookingIntent> {
  return getClient().requestJson<BookingIntent>(
    `/tasks/${taskId}/booking-intents`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        source,
        tasker_id: taskerId,
        original_booking_id: originalBookingId,
      }),
    },
    accessToken,
  );
}

export async function confirmBookingIntent(
  accessToken: string,
  bookingIntentId: string,
  idempotencyKey: string,
): Promise<Booking> {
  return getClient().requestJson<Booking>(
    `/booking-intents/${bookingIntentId}/confirm`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    accessToken,
  );
}

export async function declineBookingIntent(
  accessToken: string,
  bookingIntentId: string,
  idempotencyKey: string,
): Promise<BookingIntent> {
  return getClient().requestJson<BookingIntent>(
    `/booking-intents/${bookingIntentId}/decline`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    accessToken,
  );
}

export async function flagNoShow(accessToken: string, bookingId: string): Promise<void> {
  return getClient().requestVoid(
    `/bookings/${bookingId}/no-show/flag`,
    { method: 'POST' },
    accessToken,
  );
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
  return getClient()
    .requestJson<{ data: BookingScheduleEvent[] }>(
      `/bookings/${bookingId}/schedule-events`,
      { method: 'GET' },
      accessToken,
    )
    .then((response) => {
      const events = response?.data ?? [];
      return events.map((event) => ({
        event: mapBookingScheduleEventType(event.event_type),
        timestamp: event.created_at,
        actor: event.actor_user_id,
        description: event.reason ?? undefined,
      }));
    });
}
