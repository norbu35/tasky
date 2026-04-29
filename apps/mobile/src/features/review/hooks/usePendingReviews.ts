import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getMyPendingReviews } from '../api';

export function usePendingReviews() {
  const session = useAuthStore((state) => state.session);
  const token = session?.accessToken;
  const uid = session?.user.id;
  return useQuery({
    queryKey: queryKeys.reviews.pending(uid!),
    queryFn: async () => {
      if (!token) return [];
      return getMyPendingReviews(token);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
