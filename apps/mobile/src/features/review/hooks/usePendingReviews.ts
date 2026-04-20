import { useQuery } from '@tanstack/react-query';

import { getMyPendingReviews } from '../api';
import { useAuthStore } from '@/store/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function usePendingReviews() {
  const session = useAuthStore((state) => state.session);
  const token = session?.accessToken;
  return useQuery({
    queryKey: queryKeys.reviews.pending(token!),
    queryFn: async () => {
      if (!token) return [];
      return getMyPendingReviews(token);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
