import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';

import { applyToTask } from '../api';

export function useApplyToTask() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      message,
      quotePrice,
    }: {
      taskId: string;
      message: string;
      quotePrice?: number | null;
    }) => applyToTask(session!.accessToken, taskId, message, quotePrice),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
