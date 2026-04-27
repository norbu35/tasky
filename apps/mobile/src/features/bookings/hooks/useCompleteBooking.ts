import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';

import { completeBooking } from '../api';

interface CompleteBookingParams {
  bookingId: string;
  idempotencyKey: string;
}

export function useCompleteBooking() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CompleteBookingParams) =>
      completeBooking(token!, params.bookingId, params.idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}
