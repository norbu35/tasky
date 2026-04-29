import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listConversations } from '../api';

export function useConversations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.chat.conversations(uid!),
    queryFn: () => listConversations(token!),
    enabled: !!token,
  });
}
