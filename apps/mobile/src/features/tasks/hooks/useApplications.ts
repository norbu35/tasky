import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useApplications(taskId: string) {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    return useQuery({
        queryKey: ['applications', taskId],
        queryFn: () => api.listApplications(token!, taskId),
        enabled: !!token && !!taskId,
    });
}
