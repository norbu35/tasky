import { useQuery } from '@tanstack/react-query';

import { listConversations } from '../api';
import { useAuthStore } from '../../../store/authStore';
import { queryKeys } from '../../../lib/queryKeys';

export function useConversations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.chat.conversations(token!),
    queryFn: () => listConversations(token!),
    enabled: !!token,
  });
}
