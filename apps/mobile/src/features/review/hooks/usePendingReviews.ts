import { useQuery } from '@tanstack/react-query';

import { getMyPendingReviews } from '../api';
import { useAuthStore } from '../../../store/authStore';

export const PENDING_REVIEWS_QUERY_KEY = 'pending-reviews';

export function usePendingReviews() {
  const session = useAuthStore((state) => state.session);
  const token = session?.accessToken;
  return useQuery({
    queryKey: [PENDING_REVIEWS_QUERY_KEY, token],
    queryFn: async () => {
      if (!token) return [];
      return getMyPendingReviews(token);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
