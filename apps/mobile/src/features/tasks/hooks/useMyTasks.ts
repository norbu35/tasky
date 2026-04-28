import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listMyTasks } from '../api';

export function useMyTasks() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.tasks.my(token!),
    queryFn: () => listMyTasks(token!),
    enabled: !!token,
  });
}
