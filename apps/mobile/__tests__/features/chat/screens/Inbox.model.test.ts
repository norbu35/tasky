import type { ConversationItem } from '@/features/chat/screens/Inbox.model';

describe('ConversationItem', () => {
  it('TID-MOBILE-INBOX-MODEL captures the inbox list data contract', () => {
    const item = {
      id: 'conversation-1',
      task_id: 'task-1',
      task_title: 'Apartment cleaning',
      counterparty_id: 'tasker-1',
      counterparty_name: 'Temuulen Bold',
      counterparty_avatar_url: null,
      counterparty_last_active_at: null,
      last_message_content: 'I can arrive at 10:00.',
      last_message_at: '2026-04-29T02:00:00.000Z',
      unread_count: 1,
      created_at: '2026-04-29T01:00:00.000Z',
    } satisfies ConversationItem;

    expect(item.id).toBe('conversation-1');
    expect(item.unread_count).toBe(1);
  });
});
