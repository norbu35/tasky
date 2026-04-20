import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useMyProfile } from '../features/profile/hooks/useProfile';
import { useAuthStore } from '../store/authStore';
import { isRestricted } from '../utils/routeGuard';

interface GuardOptions {
  requireAuth?: boolean;
}

export function useRouteGuard(options: GuardOptions = { requireAuth: true }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { data: profile } = useMyProfile();

  useEffect(() => {
    if (options.requireAuth && !session) {
      router.replace('/(auth)');
      return;
    }
    if (profile && isRestricted(profile)) {
      if (profile.status === 'BANNED') {
        router.replace('/account/banned' as `${string}`);
      } else {
        router.replace('/account/suspended' as `${string}`);
      }
      return;
    }
  }, [session, profile, options.requireAuth, router]);

  return { isAuthenticated: !!session, isRestricted: isRestricted(profile ?? null) };
}
