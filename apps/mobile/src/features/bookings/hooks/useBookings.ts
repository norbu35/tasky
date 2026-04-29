import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listBookings } from '../api';

export function useBookings() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.bookings.all(uid!),
    queryFn: () => listBookings(token!, {}),
    enabled: !!token,
  });
}
