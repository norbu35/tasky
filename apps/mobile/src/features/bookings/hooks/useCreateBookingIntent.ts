import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';

import { createBookingIntent } from '../api';

interface CreateBookingIntentParams {
  taskId: string;
  source: 'REBOOK';
  originalBookingId?: string;
  taskerId: string;
  idempotencyKey: string;
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
        params.idempotencyKey,
        params.originalBookingId,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
