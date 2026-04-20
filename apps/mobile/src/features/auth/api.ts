import { createMobileApiClient } from '@/lib/mobileApiClient';
import type { AuthTokens } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function requestOtp(phone: string): Promise<string> {
  return getClient().requestOtp(phone);
}

export async function verifyOtp(phone: string, code: string): Promise<AuthTokens> {
  return getClient().verifyOtp(phone, code);
}

export async function devLogin(phone: string, role: 'CUSTOMER' | 'TASKER'): Promise<AuthTokens> {
  return getClient().devLogin(phone, role);
}
