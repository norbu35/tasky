import { useQuery } from '@tanstack/react-query';

import { getMyStats } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useMyStats() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['myStats', token],
    queryFn: () => getMyStats(token!),
    enabled: !!token,
  });
}
