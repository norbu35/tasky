export interface ConversationItem {
  id: string;
  task_id: string;
  task_title?: string | null;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_avatar_url?: string | null;
  counterparty_last_active_at?: string | null;
  last_message_content?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  created_at: string;
}
