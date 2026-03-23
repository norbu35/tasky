import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { isRestricted } from '../utils/routeGuard';

interface GuardOptions {
  requireAuth?: boolean;
}

export function useRouteGuard(options: GuardOptions = { requireAuth: true }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (options.requireAuth && !session) {
      router.replace('/(auth)');
      return;
    }
    if (profile && isRestricted(profile)) {
      if (profile.status === 'BANNED') {
        router.replace('/account/banned' as any);
      } else {
        router.replace('/account/suspended' as any);
      }
      return;
    }
  }, [session, profile, options.requireAuth, router]);

  return { isAuthenticated: !!session, isRestricted: isRestricted(profile) };
}
