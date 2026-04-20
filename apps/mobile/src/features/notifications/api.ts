import { createMobileApiClient } from '@/lib/mobileApiClient';

const getClient = () => createMobileApiClient();

export async function registerDevice(
  accessToken: string,
  payload: { token: string; platform: 'IOS' | 'ANDROID' | 'WEB' },
): Promise<string> {
  return getClient().registerDevice(accessToken, payload);
}

export async function unregisterDevice(accessToken: string, token: string): Promise<void> {
  return getClient().unregisterDevice(accessToken, token);
}
