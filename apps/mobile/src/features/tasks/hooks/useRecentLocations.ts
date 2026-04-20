import { useQuery } from '@tanstack/react-query';

import { listRecentLocations } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useRecentLocations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['recent-locations', token],
    queryFn: () => listRecentLocations(token!),
    enabled: !!token,
    select: (data) => data.locations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
