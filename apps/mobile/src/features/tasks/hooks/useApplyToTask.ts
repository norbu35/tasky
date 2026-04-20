import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyToTask } from '../api';
import { useAuthStore } from '@/store/authStore';

export function useApplyToTask() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message: string }) =>
      applyToTask(session!.accessToken, taskId, message),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
