import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

interface ConfirmBookingIntentParams {
  bookingIntentId: string;
  liabilityDisclaimerAccepted: boolean;
  idempotencyKey: string;
}

export function useConfirmBookingIntent() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ConfirmBookingIntentParams) =>
      api.confirmBookingIntent(
        token!,
        params.bookingIntentId,
        params.liabilityDisclaimerAccepted,
        params.idempotencyKey,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
