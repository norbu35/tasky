import { useQuery } from '@tanstack/react-query';

import { listTasks } from '../api';
import type { PublicTask } from '@/lib/api/types';
import { useMyProfile } from '@/features/profile/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { getCurrentLocation } from '@/utils/permissions';
import { queryKeys } from '@/lib/queryKeys';

export function useTasks() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.tasks.all(token!),
    queryFn: async () => {
      const location = await getCurrentLocation();
      const filters = location
        ? { lat: location.latitude, lng: location.longitude, radiusKm: 10 }
        : {};
      return listTasks(token!, filters);
    },
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
  const { data: profile } = useMyProfile();
  const token = session?.accessToken;

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks.all(token!),
    queryFn: () => listTasks(token!, {}),
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
