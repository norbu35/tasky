import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateTaskRequest } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';

import { createTask } from '../api';

export function useCreateTask() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskRequest) => createTask(token!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      void queryClient.invalidateQueries({ queryKey: ['recentLocations'] });
    },
  });
}
