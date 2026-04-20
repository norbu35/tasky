import { createMobileApiClient } from '@/lib/mobileApiClient';
import type { AuthTokens, User } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function requestOtp(phone: string): Promise<string> {
  const response = await getClient().requestJson<{ message: string }>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  return response.message;
}

export async function verifyOtp(phone: string, code: string): Promise<AuthTokens> {
  return getClient()
    .requestJson<{ access_token: string; refresh_token: string; user: User }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    })
    .then((response) => ({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user,
    }));
}

export async function devLogin(phone: string, role: 'CUSTOMER' | 'TASKER'): Promise<AuthTokens> {
  return getClient()
    .requestJson<{ access_token: string; refresh_token: string; user: User }>('/auth/dev/login', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    })
    .then((response) => ({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user,
    }));
}
