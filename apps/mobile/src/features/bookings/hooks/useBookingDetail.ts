import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getBooking } from '../api';

export function useBookingDetail(bookingId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.bookings.detail(uid!, bookingId!),
    queryFn: () => getBooking(token!, bookingId!),
    enabled: !!token && !!bookingId,
  });
}
