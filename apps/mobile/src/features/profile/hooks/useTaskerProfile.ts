import { useQuery } from '@tanstack/react-query';

import { getPublicProfile } from '../api';
import { getUserReviews } from '../../review/api';
import { useAuthStore } from '../../../store/authStore';
import { queryKeys } from '../../../lib/queryKeys';

export function useTaskerProfile(userId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.public(token!, userId!),
    queryFn: () => getPublicProfile(token!, userId!),
    enabled: !!token && !!userId,
  });

  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews.user(token!, userId!),
    queryFn: () => getUserReviews(token!, userId!),
    enabled: !!token && !!userId,
  });

  return { profile: profileQuery, reviews: reviewsQuery };
}
