import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

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
      api.cancelBooking(token!, params.bookingId, params.idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
