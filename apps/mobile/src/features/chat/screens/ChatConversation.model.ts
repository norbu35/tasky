export interface MessageItem {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export const PHONE_REGEX = /(\+?976)?[\s-]?\d{4}[\s-]?\d{4}|\d{8,}/;

export function formatMessageTimestamp(createdAt: string): string {
  const date = new Date(createdAt);
  return isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
