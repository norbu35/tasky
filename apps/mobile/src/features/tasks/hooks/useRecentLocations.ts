import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useRecentLocations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['recent-locations'],
    queryFn: () => api.listRecentLocations(token!),
    enabled: !!token,
    select: (data) => data.locations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
