import { useQuery } from '@tanstack/react-query';

import { listMessages } from '../api';
import { useAuthStore } from '@/store/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function useMessages(conversationId: string) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.chat.messages(token!, conversationId),
    queryFn: () => listMessages(token!, conversationId),
    enabled: !!token && !!conversationId,
  });
}
