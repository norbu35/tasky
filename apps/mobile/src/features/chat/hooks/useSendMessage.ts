import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { sendMessage } from '../api';

interface SendMessageInput {
  conversationId: string;
  content: string;
}

export function useSendMessage() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      sendMessage(token!, input.conversationId, input.content),
    onSuccess: (_data, variables) => {
      if (uid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.chat.messages(uid, variables.conversationId),
        });
      }
      void queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
  });
}
