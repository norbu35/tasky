import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rescheduleBooking } from '../api';
import { useAuthStore } from '../../../store/authStore';

interface RescheduleParams {
  bookingId: string;
  proposed_scheduled_at: string;
  reason?: string;
  idempotencyKey: string;
}

export function useReschedule() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RescheduleParams) =>
      rescheduleBooking(
        token!,
        params.bookingId,
        { proposed_scheduled_at: params.proposed_scheduled_at, reason: params.reason },
        params.idempotencyKey,
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] });
    },
  });
}
