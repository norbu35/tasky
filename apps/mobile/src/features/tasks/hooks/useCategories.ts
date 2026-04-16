import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useCategories() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['categories', token],
    queryFn: () => api.listCategories(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 30,
  });
}
