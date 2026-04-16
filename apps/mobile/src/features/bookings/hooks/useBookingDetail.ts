import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useBookingDetail(bookingId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['booking', token, bookingId],
    queryFn: () => api.getBooking(token!, bookingId!),
    enabled: !!token && !!bookingId,
  });
}
