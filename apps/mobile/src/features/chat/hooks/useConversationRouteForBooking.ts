import { useMemo } from 'react';

import { useConversations } from './useConversations';

interface ConversationRouteInput {
  taskId?: string | null;
  counterpartyId?: string | null;
}

interface ConversationRouteResult {
  conversationId?: string;
  route: `/inbox/${string}` | '/inbox';
}

export function useConversationRouteForBooking({
  taskId,
  counterpartyId,
}: ConversationRouteInput): ConversationRouteResult {
  const { data } = useConversations();

  const conversationId = useMemo(() => {
    if (!taskId || !counterpartyId) return undefined;
    return data?.data?.find(
      (conversation) =>
        conversation.task_id === taskId && conversation.counterparty_id === counterpartyId,
    )?.id;
  }, [counterpartyId, data?.data, taskId]);

  return {
    conversationId,
    route: conversationId ? `/inbox/${conversationId}` : '/inbox',
  };
}
