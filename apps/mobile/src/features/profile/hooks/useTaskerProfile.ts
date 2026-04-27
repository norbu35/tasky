import { useQuery } from '@tanstack/react-query';

import { getUserReviews } from '@/features/review';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

export function useTaskerProfile(userId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  const profileQuery = {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: async () => undefined,
  };

  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews.user(token!, userId!),
    queryFn: () => getUserReviews(token!, userId!),
    enabled: !!token && !!userId,
  });

  return { profile: profileQuery, reviews: reviewsQuery };
}
