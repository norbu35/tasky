import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listApplications } from '../api';

export function useApplications(taskId: string) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.tasks.applications(uid!, taskId),
    queryFn: () => listApplications(token!, taskId),
    enabled: !!token && !!taskId,
  });
}
