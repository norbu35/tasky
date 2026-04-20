import { createMobileApiClient, buildBaseUrl } from '@/lib/mobileApiClient';
import type { Conversation, CursorPage, Message } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export { buildBaseUrl };

export async function listConversations(accessToken: string): Promise<CursorPage<Conversation>> {
  return getClient().requestJson<CursorPage<Conversation>>(
    '/conversations',
    { method: 'GET' },
    accessToken,
    { limit: 100 },
  );
}

export async function listMessages(
  accessToken: string,
  conversationId: string,
): Promise<CursorPage<Message>> {
  return getClient().requestJson<CursorPage<Message>>(
    `/conversations/${conversationId}/messages`,
    { method: 'GET' },
    accessToken,
    { limit: 100 },
  );
}

export async function sendMessage(
  accessToken: string,
  conversationId: string,
  content: string,
): Promise<Message> {
  return getClient().requestJson<Message>(
    `/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
    accessToken,
  );
}
