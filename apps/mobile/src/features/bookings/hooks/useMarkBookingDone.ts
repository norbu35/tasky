import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markBookingDone } from '../api';
import { useAuthStore } from '@/store/authStore';

interface MarkBookingDoneParams {
  bookingId: string;
  idempotencyKey: string;
}

export function useMarkBookingDone() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MarkBookingDoneParams) =>
      markBookingDone(token!, params.bookingId, params.idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}
