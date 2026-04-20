import { useQuery } from '@tanstack/react-query';

import { listBookings } from '../api';
import { useAuthStore } from '@/store/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function useBookings() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.bookings.all(token!),
    queryFn: () => listBookings(token!, {}),
    enabled: !!token,
  });
}
