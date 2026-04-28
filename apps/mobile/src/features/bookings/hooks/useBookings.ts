import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listBookings } from '../api';

export function useBookings() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.bookings.all(token!),
    queryFn: () => listBookings(token!, {}),
    enabled: !!token,
  });
}
