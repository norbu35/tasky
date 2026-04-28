import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import type { ConversationItem } from './Inbox.model';

const { colors } = mobileTheme;
const AVATAR_SIZE = 68;

function ConversationAvatar({ item, title }: { item: ConversationItem; title: string }) {
  const initials = title
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      className="items-center justify-center rounded-full bg-muted"
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
    >
      <Text className="text-subtitle font-sans-bold text-primary-deep">{initials || '?'}</Text>
      {item.counterparty_avatar_url ? (
        <Image
          source={{ uri: item.counterparty_avatar_url }}
          style={{
            borderRadius: AVATAR_SIZE / 2,
            height: AVATAR_SIZE,
            position: 'absolute',
            width: AVATAR_SIZE,
          }}
        />
      ) : null}
    </View>
  );
}

interface ConversationRowProps {
  item: ConversationItem;
  onPress: () => void;
  timestamp: string;
}

export function ConversationRow({ item, onPress, timestamp }: ConversationRowProps) {
  const { t } = useTranslation();
  const title = item.counterparty_name ?? item.task_title ?? t('messaging.taskDiscussion');
  const isUnread = (item.unread_count ?? 0) > 0;
  const preview = item.last_message_content || t('messaging.taskDiscussion');
  const context = item.task_title
    ? `${item.task_title} · ${t('shared.inbox.contextStatus')}`
    : t('shared.inbox.contextStatus');

  return (
    <Touchable
      accessibilityLabel={title}
      accessibilityRole="button"
      className="flex-row items-start py-sm"
      onPress={onPress}
      testID={`conversation-row-${item.id}`}
    >
      <View className="mr-md">
        <ConversationAvatar item={item} title={title} />
      </View>

      <View className="min-w-0 flex-1 pt-[2px]">
        <View className="flex-row items-start justify-between gap-sm">
          <Text
            className={cn(
              'min-w-0 flex-1 text-title font-sans-bold text-primary-deep',
              isUnread ? 'text-primary-deep' : 'text-foreground',
            )}
            numberOfLines={1}
          >
            {title}
          </Text>
          {timestamp ? (
            <Text className="shrink-0 text-body text-text-secondary" numberOfLines={1}>
              {timestamp}
            </Text>
          ) : null}
        </View>

        <Text
          className={cn(
            'mt-[2px] text-body text-text-secondary',
            isUnread ? 'font-sans-bold text-foreground' : 'font-sans',
          )}
          numberOfLines={1}
        >
          {preview}
        </Text>

        <View className="mt-[2px] min-w-0 flex-row items-center gap-xs">
          {isUnread ? (
            <View
              accessibilityLabel={t('shared.inbox.unreadLabel')}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.secondary }}
              testID={`conversation-row-${item.id}-unread`}
            />
          ) : null}
          <Text className="min-w-0 flex-1 text-body text-text-secondary" numberOfLines={1}>
            {context}
          </Text>
        </View>
      </View>
    </Touchable>
  );
}
