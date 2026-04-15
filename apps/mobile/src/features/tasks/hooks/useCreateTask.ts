import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createMobileApiClient, type CreateTaskRequest } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useCreateTask() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskRequest) => api.createTask(token!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      void queryClient.invalidateQueries({ queryKey: ['recent-locations'] });
    },
  });
}
