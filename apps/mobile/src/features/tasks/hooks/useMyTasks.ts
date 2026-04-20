import { useQuery } from '@tanstack/react-query';

import { listMyTasks } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useMyTasks() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['myTasks', token],
    queryFn: () => listMyTasks(token!),
    enabled: !!token,
  });
}
