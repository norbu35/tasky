import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useMessages(conversationId: string) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.listMessages(token!, conversationId),
    enabled: !!token && !!conversationId,
  });
}
