import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useMessages(conversationId: string) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['messages', token, conversationId],
    queryFn: () => api.listMessages(token!, conversationId),
    enabled: !!token && !!conversationId,
  });
}
