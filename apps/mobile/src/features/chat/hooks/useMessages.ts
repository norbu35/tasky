import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { listMessages } from '../api';

export function useMessages(conversationId: string) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.chat.messages(uid!, conversationId),
    queryFn: () => listMessages(token!, conversationId),
    enabled: !!token && !!conversationId,
  });
}
