import { useConversations } from './useConversations';

/**
 * Returns the total number of unread messages across all conversations.
 * Used by the tab bar to show an unread badge on the Inbox tab.
 */
export function useUnreadCount(): number {
  const { data } = useConversations();
  const conversations = data?.data ?? [];
  return conversations.reduce(
    (total: number, conv: { unread_count?: number }) => total + (conv.unread_count ?? 0),
    0,
  );
}
