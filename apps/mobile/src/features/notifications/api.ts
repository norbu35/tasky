import { createMobileApiClient } from '@/lib/mobileApiClient';

const getClient = () => createMobileApiClient();

export async function registerDevice(
  accessToken: string,
  payload: { token: string; platform: 'IOS' | 'ANDROID' | 'WEB' },
): Promise<string> {
  return getClient()
    .requestJson<{ message?: string }>(
      '/notifications/devices',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    )
    .then((response) => response.message ?? 'Device registered.');
}

export async function unregisterDevice(accessToken: string, token: string): Promise<void> {
  return getClient().requestVoid(
    `/notifications/devices/${encodeURIComponent(token)}`,
    { method: 'DELETE' },
    accessToken,
  );
}
