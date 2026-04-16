import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useApplications(taskId: string) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['applications', token, taskId],
    queryFn: () => api.listApplications(token!, taskId),
    enabled: !!token && !!taskId,
  });
}
