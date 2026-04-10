import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSocketBaseUrl, HttpApiClient } from './apiClient';

const accessToken = 'facebook-token-test';

function mockOkResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HttpApiClient URL resolution', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('prefixes /api/v1 when base URL has no path', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockOkResponse({
        access_token: 'access',
        refresh_token: 'refresh',
        user: {
          id: 'user-1',
          phone: null,
          facebook_id: 'fb-user-1',
          role: 'CUSTOMER',
          status: 'PENDING',
          created_at: '2026-02-20T00:00:00Z',
        },
      }),
    );
    const client = new HttpApiClient('http://localhost:8080');

    await client.loginWithFacebook(accessToken);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8080/api/v1/auth/facebook');
  });

  it('does not duplicate /api/v1 when already present in base URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockOkResponse({
        access_token: 'access',
        refresh_token: 'refresh',
        user: {
          id: 'user-1',
          phone: null,
          facebook_id: 'fb-user-1',
          role: 'CUSTOMER',
          status: 'PENDING',
          created_at: '2026-02-20T00:00:00Z',
        },
      }),
    );
    const client = new HttpApiClient('http://localhost:8080/api/v1');

    await client.loginWithFacebook(accessToken);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8080/api/v1/auth/facebook');
  });

  it('uses the current origin when VITE_API_BASE_URL is not configured', async () => {
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: new URL('http://127.0.0.1:8080/messages'),
    });
    vi.stubEnv('VITE_API_BASE_URL', '');

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockOkResponse({
        access_token: 'access',
        refresh_token: 'refresh',
        user: {
          id: 'user-1',
          phone: null,
          facebook_id: 'fb-user-1',
          role: 'CUSTOMER',
          status: 'PENDING',
          created_at: '2026-02-20T00:00:00Z',
        },
      }),
    );

    const client = new HttpApiClient();

    await client.loginWithFacebook(accessToken);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:8080/api/v1/auth/facebook');
    expect(buildSocketBaseUrl()).toBe('http://127.0.0.1:8080/ws');

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
});
