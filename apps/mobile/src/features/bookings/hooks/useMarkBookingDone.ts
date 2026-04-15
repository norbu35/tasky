import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

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
      api.markBookingDone(token!, params.bookingId, params.idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}
