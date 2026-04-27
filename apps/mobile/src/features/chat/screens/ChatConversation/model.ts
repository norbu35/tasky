export interface MessageItem {
  id: string;
  content: string;
  sender_id: string;
  sent_at: string;
}

export const PHONE_REGEX = /(\+?976)?[\s-]?\d{4}[\s-]?\d{4}|\d{8,}/;

export function orderMessagesChronologically<T extends MessageItem>(messages: T[]): T[] {
  return [...messages].sort((a, b) => {
    const timeDelta = new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
    if (timeDelta !== 0) {
      return timeDelta;
    }
    return a.id.localeCompare(b.id);
  });
}

export function formatMessageTimestamp(sentAt: string): string {
  const date = new Date(sentAt);
  return isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
