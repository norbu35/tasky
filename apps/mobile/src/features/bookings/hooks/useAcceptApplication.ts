import { useMutation, useQueryClient } from '@tanstack/react-query';

import { acceptApplication } from '../api';
import { useAuthStore } from '../../../store/authStore';

interface AcceptApplicationParams {
  taskId: string;
  applicationId: string;
  liabilityDisclaimerAccepted: boolean;
  idempotencyKey: string;
}

export function useAcceptApplication() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AcceptApplicationParams) =>
      acceptApplication(
        token!,
        params.taskId,
        params.applicationId,
        params.liabilityDisclaimerAccepted,
        params.idempotencyKey,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
