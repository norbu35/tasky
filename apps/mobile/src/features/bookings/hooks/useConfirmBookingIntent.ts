import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';

import { confirmBookingIntent } from '../api';

interface ConfirmBookingIntentParams {
  bookingIntentId: string;
  idempotencyKey: string;
}

export function useConfirmBookingIntent() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ConfirmBookingIntentParams) =>
      confirmBookingIntent(token!, params.bookingIntentId, params.idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
