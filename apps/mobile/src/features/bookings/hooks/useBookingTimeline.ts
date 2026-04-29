import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getBookingTimeline } from '../api';

export function useBookingTimeline(bookingId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.bookings.timeline(uid!, bookingId!),
    queryFn: () => getBookingTimeline(token!, bookingId!),
    enabled: !!token && !!bookingId,
  });
}
