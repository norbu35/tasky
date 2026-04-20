import { useQuery } from '@tanstack/react-query';

import { listApplications } from '../api';
import { useAuthStore } from '../../../store/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function useApplications(taskId: string) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.tasks.applications(token!, taskId),
    queryFn: () => listApplications(token!, taskId),
    enabled: !!token && !!taskId,
  });
}
