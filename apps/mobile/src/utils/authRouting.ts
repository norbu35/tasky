import type { AuthTokens } from '../lib/api/types';

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

  return '/(tabs)';
}
