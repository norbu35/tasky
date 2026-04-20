import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useReviewGate } from '@/features/review/components/ReviewGateProvider';
import { useMyTasks } from '@/features/tasks/hooks/useMyTasks';

import { type TaskLike, type TaskState, mapStatus } from './CustomerTasks.model';

export function useCustomerTasks() {
  const router = useRouter();
  const { data, isLoading, isError, isFetching, refetch } = useMyTasks();

  const tasks = useMemo(() => {
    return [...((data?.data ?? []) as TaskLike[])].sort((a, b) => {
      const aTime = new Date(a.scheduled_at ?? 0).getTime();
      const bTime = new Date(b.scheduled_at ?? 0).getTime();
      return bTime - aTime;
    });
  }, [data?.data]);

  const counts = useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          const status = mapStatus(task.status ?? 'open');
          acc[status] += 1;
          return acc;
        },
        { open: 0, assigned: 0, completed: 0, cancelled: 0, no_show: 0 } as Record<
          TaskState,
          number
        >,
      ),
    [tasks],
  );

  const { isLocked } = useReviewGate();

  const handleFabPress = useCallback(() => {
    if (isLocked) return;
    router.push('/(customer)/tasks/new');
  }, [router, isLocked]);

  const handleNotificationsPress = useCallback(() => {
    router.push('/(shared)/notifications');
  }, [router]);

  const handleTaskPress = useCallback(
    (taskId: string) => {
      router.push(`/(customer)/tasks/${taskId}`);
    },
    [router],
  );

  return {
    tasks,
    counts,
    isLoading,
    isError,
    isFetching,
    refetch,
    handleFabPress,
    handleNotificationsPress,
    handleTaskPress,
  };
}
