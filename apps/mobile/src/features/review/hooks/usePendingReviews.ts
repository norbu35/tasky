import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();
export const PENDING_REVIEWS_QUERY_KEY = 'pending-reviews';

export function usePendingReviews() {
  const session = useAuthStore((state) => state.session);
  const token = session?.accessToken;
  return useQuery({
    queryKey: [PENDING_REVIEWS_QUERY_KEY, token],
    queryFn: async () => {
      if (!token) return [];
      return api.getMyPendingReviews(token);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
