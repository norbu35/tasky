import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';

import { raiseDispute } from '../api';

interface DisputeCreateParams {
  bookingId: string;
  reason: string;
  idempotencyKey: string;
}

export function useDisputeCreate() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DisputeCreateParams) =>
      raiseDispute(token!, params.bookingId, params.reason, params.idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
      void queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}
