import type { AuthTokens } from '../lib/mobileApiClient';

export function resolvePostAuthHref(
  session: AuthTokens | null,
  hasSeenOnboarding: boolean,
): string {
  if (!session) {
    return '/(auth)';
  }

  if (!hasSeenOnboarding) {
    return '/onboarding';
  }

  if (session.user.primary_auth === 'FACEBOOK') {
    return '/(auth)/otp-migration';
  }

  return session.user.role === 'CUSTOMER' ? '/(customer)/tasks' : '/(tabs)';
}
