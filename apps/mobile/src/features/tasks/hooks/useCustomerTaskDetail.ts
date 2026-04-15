import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient, type Task } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

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
    queryKey: ['myTasks'],
    queryFn: () => api.listMyTasks(token!),
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
