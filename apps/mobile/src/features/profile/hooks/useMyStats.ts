import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getMyStats } from '../api';

export function useMyStats() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.profile.stats(uid!),
    queryFn: () => getMyStats(token!),
    enabled: !!token,
  });
}
