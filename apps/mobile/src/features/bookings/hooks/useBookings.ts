import { useQuery } from '@tanstack/react-query';

import { listBookings } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useBookings() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['bookings', token],
    queryFn: () => listBookings(token!, {}),
    enabled: !!token,
  });
}
