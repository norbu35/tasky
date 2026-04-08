import { createMobileApiClient } from '../../src/lib/mobileApiClient';

describe('mobileApiClient boundary wiring', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TID-TASK-149-MOBILE-API-MARK-DONE uses the booking mark-done contract', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        booking: {
          id: 'booking-1',
          status: 'ASSIGNED',
        },
        tasker_marked_done_at: '2026-04-09T11:00:00Z',
      }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const client = createMobileApiClient('http://localhost:8080');
    const booking = await client.markBookingDone('access-token', 'booking-1', 'idem-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/bookings/booking-1/mark-done',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    );
    expect(booking).toEqual({
      id: 'booking-1',
      status: 'ASSIGNED',
    });
  });

  it('TID-TASK-150-MOBILE-API-NO-SHOW uses the booking no-show contract', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'booking-2', status: 'NO_SHOW' }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const client = createMobileApiClient('http://localhost:8080');
    const booking = await client.flagNoShow('access-token', 'booking-2');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/bookings/booking-2/no-show/flag',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    );
    expect(booking).toEqual({
      id: 'booking-2',
      status: 'NO_SHOW',
    });
  });

  it('TID-TASK-151-MOBILE-API-BOOKING-TIMELINE maps schedule-events into mobile timeline rows', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'evt-1',
            booking_id: 'booking-3',
            event_type: 'REQUESTED',
            actor_user_id: 'user-1',
            proposed_scheduled_at: '2026-04-10T09:00:00Z',
            reason: 'Need a later slot',
            created_at: '2026-04-09T10:00:00Z',
          },
        ],
      }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const client = createMobileApiClient('http://localhost:8080');
    const events = await client.getBookingTimeline('access-token', 'booking-3');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/bookings/booking-3/schedule-events',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );
    expect(events).toEqual([
      {
        event: 'reschedule_requested',
        timestamp: '2026-04-09T10:00:00Z',
        actor: 'user-1',
        description: 'Need a later slot',
      },
    ]);
  });

  it('TID-TASK-152-MOBILE-API-VERIFICATION-UPLOAD sends the current upload-url contract', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        upload_url: 'https://upload.example.com',
        storage_key: 'verification/key-1',
      }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const client = createMobileApiClient('http://localhost:8080');
    await client.getVerificationUploadUrl('access-token', {
      content_type: 'image/jpeg',
      document_side: 'SELFIE',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/verification/upload-url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content_type: 'image/jpeg' }),
      }),
    );
  });

  it('TID-TASK-153-MOBILE-API-VERIFICATION-SUBMIT sends front-back-selfie consent payload expected by backend', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'PENDING' }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const client = createMobileApiClient('http://localhost:8080');
    const status = await client.submitVerification('access-token', {
      id_card_front_key: 'front-key',
      id_card_back_key: 'back-key',
      selfie_key: 'selfie-key',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/verification/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          id_card_front_key: 'front-key',
          id_card_back_key: 'back-key',
          selfie_key: 'selfie-key',
          consent_policy_version: 'v1.0',
          consent_accepted: true,
        }),
      }),
    );
    expect(status).toEqual({ status: 'PENDING' });
  });
});
