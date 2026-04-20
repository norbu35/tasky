import {
  createMobileApiClient,
  resolveDefaultLocalApiBaseUrl,
} from '../../src/lib/mobileApiClient';

describe('mobileApiClient boundary wiring', () => {
  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;
  const originalApiBaseUrl = runtimeEnv?.['EXPO_PUBLIC_API_BASE_URL'];

  afterEach(() => {
    jest.restoreAllMocks();
    if (!runtimeEnv) {
      return;
    }
    if (originalApiBaseUrl === undefined) {
      delete runtimeEnv['EXPO_PUBLIC_API_BASE_URL'];
    } else {
      runtimeEnv['EXPO_PUBLIC_API_BASE_URL'] = originalApiBaseUrl;
    }
  });

  it('TID-TASK-149-MOBILE-API-MARK-DONE uses requestJson for the booking mark-done contract', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'booking-1' }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const client = createMobileApiClient('http://localhost:8080');
    await client.requestJson(
      '/bookings/booking-1/mark-done',
      {
        method: 'POST',
        headers: { 'Idempotency-Key': 'idem-1' },
      },
      'access-token',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/bookings/booking-1/mark-done',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    );
  });

  it('TID-TASK-150-MOBILE-API-NO-SHOW uses requestVoid for the booking no-show contract', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const client = createMobileApiClient('http://localhost:8080');
    await client.requestVoid(
      '/bookings/booking-2/no-show/flag',
      { method: 'POST' },
      'access-token',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/bookings/booking-2/no-show/flag',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    );
  });

  it('TID-TASK-151-MOBILE-API-BOOKING-TIMELINE uses requestJson for schedule-events', async () => {
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
    const result = await client.requestJson<{ data: any[] }>(
      '/bookings/booking-3/schedule-events',
      { method: 'GET' },
      'access-token',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/bookings/booking-3/schedule-events',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].event_type).toBe('REQUESTED');
  });

  it('uses EXPO_PUBLIC_API_BASE_URL when no explicit mobile base URL is provided', async () => {
    if (!runtimeEnv) {
      throw new Error('runtime env is not available in this Jest environment');
    }
    runtimeEnv['EXPO_PUBLIC_API_BASE_URL'] = 'http://127.0.0.1:8080';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'booking-9' }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const client = createMobileApiClient();
    await client.requestJson(
      '/bookings/booking-9/mark-done',
      {
        method: 'POST',
        headers: { 'Idempotency-Key': 'idem-9' },
      },
      'access-token',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/api/v1/bookings/booking-9/mark-done',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    );
  });

  it('uses the Android emulator loopback host for local Android defaults', () => {
    expect(resolveDefaultLocalApiBaseUrl('android')).toBe('http://10.0.2.2:8080');
  });
});
