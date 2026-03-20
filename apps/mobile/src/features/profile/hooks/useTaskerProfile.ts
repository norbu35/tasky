import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useTaskerProfile(userId: string | undefined) {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    const profileQuery = useQuery({
        queryKey: ['taskerProfile', userId],
        queryFn: () => api.getPublicProfile(token!, userId!),
        enabled: !!token && !!userId,
    });

    const reviewsQuery = useQuery({
        queryKey: ['taskerReviews', userId],
        queryFn: () => api.getUserReviews(token!, userId!),
        enabled: !!token && !!userId,
    });

    return { profile: profileQuery, reviews: reviewsQuery };
}
