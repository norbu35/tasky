import { useQuery } from '@tanstack/react-query';

import { getPublicProfile } from '../api';
import { getUserReviews } from '../../review/api';
import { useAuthStore } from '../../../store/authStore';

export function useTaskerProfile(userId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  const profileQuery = useQuery({
    queryKey: ['taskerProfile', token, userId],
    queryFn: () => getPublicProfile(token!, userId!),
    enabled: !!token && !!userId,
  });

  const reviewsQuery = useQuery({
    queryKey: ['taskerReviews', token, userId],
    queryFn: () => getUserReviews(token!, userId!),
    enabled: !!token && !!userId,
  });

  return { profile: profileQuery, reviews: reviewsQuery };
}
