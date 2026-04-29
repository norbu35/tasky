import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listRecentLocations } from '../api';

export function useRecentLocations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.tasks.recentLocations(uid!),
    queryFn: () => listRecentLocations(token!),
    enabled: !!token,
    select: (data) => data.locations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
