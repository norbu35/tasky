import { useQuery } from '@tanstack/react-query';

import { getBooking } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useBookingDetail(bookingId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['booking', token, bookingId],
    queryFn: () => getBooking(token!, bookingId!),
    enabled: !!token && !!bookingId,
  });
}
