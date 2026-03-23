import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useBookingTimeline(bookingId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['bookingTimeline', bookingId],
    queryFn: () => api.getBookingTimeline(token!, bookingId!),
    enabled: !!token && !!bookingId,
  });
}
