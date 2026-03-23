import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient, type PublicTask } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useTasks() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.listTasks(token!, {}),
    enabled: !!token,
  });
}

export interface TaskDetailState {
  task: PublicTask | null;
  isLoading: boolean;
  isError: boolean;
  isVerified: boolean;
  hasApplied: boolean;
  capReached: boolean;
  refetch: () => void;
}

export function useTaskDetail(taskId: string): TaskDetailState {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const token = session?.accessToken;

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.listTasks(token!, {}),
    enabled: !!token,
  });

  const tasks = tasksQuery.data?.data ?? [];
  const task = tasks.find((t) => t.id === taskId) ?? null;

  const isVerified = profile?.status === 'VERIFIED';
  const hasApplied = false; // Will be enhanced with application state tracking
  const capReached = false; // Will be enhanced with cap checking

  return {
    task,
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    isVerified,
    hasApplied,
    capReached,
    refetch: tasksQuery.refetch,
  };
}
