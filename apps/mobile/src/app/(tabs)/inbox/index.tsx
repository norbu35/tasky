import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useConversations } from '../../../features/chat/hooks/useConversations';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

interface ConversationItem {
  id: string;
  task_title?: string;
  last_message_preview?: string;
  last_message_at?: string;
  counterparty_name?: string;
  counterparty_avatar_url?: string | null;
  unread_count?: number;
}

export default function ConversationListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useConversations();

  const conversations: ConversationItem[] = data?.data ?? [];

  const renderItem = useCallback(
    (item: ConversationItem) => {
      const initial = (item.counterparty_name ?? item.task_title ?? 'T').charAt(0);
      return (
        <TouchableOpacity
          testID={`conversation-row-${item.id}`}
          style={styles.row}
          onPress={() => router.push(`/inbox/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.counterparty_name ??
                  item.task_title ??
                  t('messaging.taskDiscussion', 'Task Discussion')}
              </Text>
              {item.last_message_at && (
                <Text style={styles.timestamp}>
                  {new Date(item.last_message_at).toLocaleDateString()}
                </Text>
              )}
            </View>
            {item.last_message_preview && (
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_message_preview}
              </Text>
            )}
          </View>
          {(item.unread_count ?? 0) > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [router, t],
  );

  return (
    <FeedListTemplate
      testID="conversation-list"
      data={conversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isError={isError}
      isEmpty={conversations.length === 0}
      onRefresh={refetch}
      isRefreshing={isRefetching}
      onRetry={refetch}
      emptyTitle={t('shared.inbox.emptyTitle')}
      emptyDescription={t('shared.inbox.emptyDescription')}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  timestamp: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
  },
  preview: {
    fontSize: typography.label,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  },
  unreadText: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
});
