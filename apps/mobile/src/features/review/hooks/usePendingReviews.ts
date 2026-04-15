import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();
export const PENDING_REVIEWS_QUERY_KEY = 'pending-reviews';

export function usePendingReviews() {
  const session = useAuthStore((state) => state.session);
  return useQuery({
    queryKey: [PENDING_REVIEWS_QUERY_KEY],
    queryFn: async () => {
      if (!session?.accessToken) return [];
      return api.getMyPendingReviews(session.accessToken);
    },
    enabled: !!session?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
