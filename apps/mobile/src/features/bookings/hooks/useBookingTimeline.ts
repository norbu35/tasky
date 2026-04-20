import { useQuery } from '@tanstack/react-query';

import { getBookingTimeline } from '../api';
import { useAuthStore } from '../../../store/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function useBookingTimeline(bookingId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.bookings.timeline(token!, bookingId!),
    queryFn: () => getBookingTimeline(token!, bookingId!),
    enabled: !!token && !!bookingId,
  });
}
