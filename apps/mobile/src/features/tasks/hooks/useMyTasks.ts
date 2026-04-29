import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listMyTasks } from '../api';

export function useMyTasks() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.tasks.my(uid!),
    queryFn: () => listMyTasks(token!),
    enabled: !!token,
  });
}
