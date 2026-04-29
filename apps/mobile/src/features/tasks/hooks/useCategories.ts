import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listCategories } from '../api';

export function useCategories() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.tasks.categories(uid!),
    queryFn: () => listCategories(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 30,
  });
}
