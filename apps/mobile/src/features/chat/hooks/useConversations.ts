import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listConversations } from '../api';

export function useConversations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.chat.conversations(token!),
    queryFn: () => listConversations(token!),
    enabled: !!token,
  });
}
