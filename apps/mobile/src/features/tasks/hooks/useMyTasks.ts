import { useQuery } from '@tanstack/react-query';

import { listMyTasks } from '../api';
import { useAuthStore } from '../../../store/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function useMyTasks() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.tasks.my(token!),
    queryFn: () => listMyTasks(token!),
    enabled: !!token,
  });
}
