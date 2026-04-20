import { useQuery } from '@tanstack/react-query';

import { listCategories } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useCategories() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['categories', token],
    queryFn: () => listCategories(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 30,
  });
}
