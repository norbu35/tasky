import { createMobileApiClient, buildBaseUrl } from '@/lib/mobileApiClient';
import type { Conversation, CursorPage, Message } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export { buildBaseUrl };

export async function listConversations(accessToken: string): Promise<CursorPage<Conversation>> {
  return getClient().listConversations(accessToken);
}

export async function listMessages(
  accessToken: string,
  conversationId: string,
): Promise<CursorPage<Message>> {
  return getClient().listMessages(accessToken, conversationId);
}

export async function sendMessage(
  accessToken: string,
  conversationId: string,
  content: string,
): Promise<Message> {
  return getClient().sendMessage(accessToken, conversationId, content);
}
