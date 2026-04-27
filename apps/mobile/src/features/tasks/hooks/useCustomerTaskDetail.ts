import { useQuery } from '@tanstack/react-query';

import type { Task } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listMyTasks } from '../api';

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
    queryKey: queryKeys.tasks.my(token!),
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
