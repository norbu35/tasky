import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';

import { type MessageItem, formatMessageTimestamp } from './model';

const { colors } = mobileTheme;

export function MessageBubble({ item, myId }: { item: MessageItem; myId?: string }) {
  const isMine = item.sender_id === myId;
  const timestamp = formatMessageTimestamp(item.sent_at);

  return (
    <View
      testID={`message-bubble-${item.id}`}
      className={`self-stretch mb-md flex-row${isMine ? ' justify-end' : ' justify-start'}`}
    >
      <View
        testID={isMine ? `message-sent-${item.id}` : `message-received-${item.id}`}
        className="max-w-[75%] px-md py-md rounded-lg"
        style={
          isMine
            ? { backgroundColor: colors.primaryDeep, borderBottomRightRadius: 6 }
            : { backgroundColor: colors.muted, borderBottomLeftRadius: 6 }
        }
      >
        <Text
          className="text-body"
          style={[
            { lineHeight: 16 * 1.25 },
            isMine ? { color: colors.card } : { color: colors.foreground },
          ]}
        >
          {item.content}
        </Text>
        {timestamp !== '' && (
          <Text
            testID={`message-timestamp-${item.id}`}
            className="mt-xs text-caption"
            style={
              isMine
                ? { color: colors.card, opacity: 0.7, textAlign: 'right' as const }
                : { color: colors.textSecondary }
            }
          >
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  );
}
