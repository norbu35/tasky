import { useQuery } from '@tanstack/react-query';

import { listMyTasks } from '../api';
import type { Task } from '@/lib/api/types';
import { useAuthStore } from '../../../store/authStore';

export interface CustomerTaskDetailState {
  task: Task | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useCustomerTaskDetail(taskId: string): CustomerTaskDetailState {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  const query = useQuery({
    queryKey: ['myTasks', token],
    queryFn: () => listMyTasks(token!),
    enabled: !!token,
  });

  const tasks = query.data?.data ?? [];
  const task = tasks.find((t) => t.id === taskId) ?? null;

  return {
    task,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
