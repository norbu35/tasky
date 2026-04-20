import { useQuery } from '@tanstack/react-query';

import { listCategories } from '../api';
import { useAuthStore } from '../../../store/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function useCategories() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.tasks.categories(token!),
    queryFn: () => listCategories(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 30,
  });
}
