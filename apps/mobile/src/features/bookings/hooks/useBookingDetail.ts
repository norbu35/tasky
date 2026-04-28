import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getBooking } from '../api';

export function useBookingDetail(bookingId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.bookings.detail(token!, bookingId!),
    queryFn: () => getBooking(token!, bookingId!),
    enabled: !!token && !!bookingId,
  });
}
