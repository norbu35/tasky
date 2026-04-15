import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

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
      api.rescheduleBooking(
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
