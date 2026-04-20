import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelBooking } from '../api';
import { useAuthStore } from '@/store/authStore';

interface CancelBookingParams {
  bookingId: string;
  idempotencyKey: string;
}

export function useCancelBooking() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CancelBookingParams) =>
      cancelBooking(token!, params.bookingId, params.idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
