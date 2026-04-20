import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBookingIntent } from '../api';
import { useAuthStore } from '@/store/authStore';

interface CreateBookingIntentParams {
  taskId: string;
  source: 'REBOOK' | 'INSTANT_MATCH';
  originalBookingId?: string;
  offerId?: string;
  taskerId: string;
}

export function useCreateBookingIntent() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateBookingIntentParams) =>
      createBookingIntent(
        token!,
        params.taskId,
        params.source,
        params.taskerId,
        params.originalBookingId,
        params.offerId,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
