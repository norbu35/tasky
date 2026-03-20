import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useCategories() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api.listCategories(token!),
        enabled: !!token,
        staleTime: 1000 * 60 * 30,
    });
}
