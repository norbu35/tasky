import { useQuery } from '@tanstack/react-query';

import { listConversations } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useConversations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['conversations', token],
    queryFn: () => listConversations(token!),
    enabled: !!token,
  });
}
