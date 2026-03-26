import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useConversations } from '../../../features/chat/hooks/useConversations';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { Input } from '../../../components/ui/Input';
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
  const [search, setSearch] = useState('');

  const conversations: ConversationItem[] = data?.data ?? [];
  const filteredConversations = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

    if (!normalizedQuery) {
      return sorted;
    }

    return sorted.filter((item) =>
      (item.counterparty_name ?? item.task_title ?? '').toLowerCase().includes(normalizedQuery),
    );
  }, [conversations, search]);

  const formatTimestamp = useCallback((value?: string) => {
    if (!value) return '';
    const timestamp = new Date(value);
    const diff = Date.now() - timestamp.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
      return timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    return timestamp.toLocaleDateString();
  }, []);

  const filterBar = (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('shared.inbox.title', 'Inbox')}</Text>
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder={t('shared.inbox.searchPlaceholder', 'Search...')}
        testID="conversation-search-input"
      />
    </View>
  );

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
                <Text style={styles.timestamp}>{formatTimestamp(item.last_message_at)}</Text>
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
    [formatTimestamp, router, t],
  );

  return (
    <FeedListTemplate
      testID="conversation-list"
      data={filteredConversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isError={isError}
      isEmpty={filteredConversations.length === 0}
      onRefresh={refetch}
      isRefreshing={isRefetching}
      onRetry={refetch}
      emptyTitle={t('shared.inbox.emptyTitle', 'No messages')}
      emptyDescription={t(
        'shared.inbox.emptyDescription',
        'Messages will appear here after you make a booking',
      )}
      errorMessage={t('shared.inbox.errorMessage', 'Failed to load messages')}
      retryLabel={t('shared.inbox.retry', 'Retry')}
      filterBar={filterBar}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
  },
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
