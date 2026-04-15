import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useConversations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.listConversations(token!),
    enabled: !!token,
  });
}
