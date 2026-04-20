import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sendMessage } from '../api';
import { useAuthStore } from '../../../store/authStore';
import { queryKeys } from '../../../lib/queryKeys';

interface SendMessageInput {
  conversationId: string;
  content: string;
}

export function useSendMessage() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      sendMessage(token!, input.conversationId, input.content),
    onSuccess: (_data, variables) => {
      if (token) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.chat.messages(token, variables.conversationId),
        });
      }
      void queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
  });
}
