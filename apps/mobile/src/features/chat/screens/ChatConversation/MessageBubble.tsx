import React from 'react';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { mobileTheme } from '@/design/tokenAdapter';

import { type MessageItem, formatMessageTimestamp } from './model';

const { colors, spacing } = mobileTheme;

export function MessageBubble({
  item,
  myId,
  counterpartyName,
  counterpartyAvatarUrl,
}: {
  item: MessageItem;
  myId?: string;
  counterpartyName?: string;
  counterpartyAvatarUrl?: string;
}) {
  const isMine = item.sender_id === myId;
  const timestamp = formatMessageTimestamp(item.sent_at);

  return (
    <View
      testID={`message-bubble-${item.id}`}
      className={`self-stretch mb-sm${isMine ? ' items-end' : ' items-start'}`}
    >
      {!isMine && (
        <Text
          className="mb-xs text-body font-sans-semibold"
          style={{ color: colors.textSecondary, marginLeft: spacing['3xl'] + spacing.sm }}
        >
          {[counterpartyName, timestamp].filter(Boolean).join(' ')}
        </Text>
      )}
      <View className={`flex-row ${isMine ? 'justify-end' : 'justify-start'} items-end`}>
        {!isMine && (
          <View style={{ marginRight: spacing.sm }}>
            <ProfileAvatar uri={counterpartyAvatarUrl} name={counterpartyName ?? 'T'} size="sm" />
          </View>
        )}
        <View
          testID={isMine ? `message-sent-${item.id}` : `message-received-${item.id}`}
          className="max-w-[76%]"
          style={{
            backgroundColor: isMine ? colors.primaryDeep : colors.muted,
            borderRadius: 28,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          <Text
            className="text-title"
            style={[
              { lineHeight: 24 * 1.25 },
              isMine ? { color: colors.card } : { color: colors.foreground },
            ]}
          >
            {item.content}
          </Text>
          {timestamp !== '' && isMine && (
            <Text
              testID={`message-timestamp-${item.id}`}
              className="mt-xs text-caption"
              style={{ color: colors.card, opacity: 0.7, textAlign: 'right' as const }}
            >
              {timestamp}
            </Text>
          )}
          {timestamp !== '' && !isMine && <View testID={`message-timestamp-${item.id}`} />}
        </View>
      </View>
    </View>
  );
}
