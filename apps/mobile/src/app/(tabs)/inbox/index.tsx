import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SearchBar } from '../../../components/ui/SearchBar';
import { mobileTheme } from '../../../design/tokenAdapter';
import { useConversations } from '../../../features/chat/hooks/useConversations';
import { formatLastActive } from '../../../lib/formatLastActive';

const { colors } = mobileTheme;

interface ConversationItem {
  id: string;
  task_id: string;
  task_title?: string | null;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_avatar_url?: string | null;
  counterparty_last_active_at?: string | null;
  last_message_content?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  created_at: string;
}

export default function ConversationListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useConversations();
  const [search, setSearch] = useState('');

  const conversations = useMemo<ConversationItem[]>(() => data?.data ?? [], [data?.data]);
  const filteredConversations = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

    if (!normalizedQuery) return sorted;

    return sorted.filter((item) => {
      const haystack = `${item.counterparty_name ?? ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
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

  const listHeader = (
    <View className="pb-item gap-item">
      <ScreenHeader title={t('shared.inbox.title')} />
    </View>
  );

  const filterBar =
    !isLoading && !isError ? (
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t('shared.inbox.searchPlaceholder')}
        testID="conversation-search-input"
      />
    ) : null;

  const renderItem = useCallback(
    (item: ConversationItem) => {
      const title = item.counterparty_name ?? item.task_title ?? t('messaging.taskDiscussion');
      const isUnread = (item.unread_count ?? 0) > 0;
      const activity = formatLastActive(item.counterparty_last_active_at);
      return (
        <Pressable
          testID={`conversation-row-${item.id}`}
          className={`flex-row items-center rounded-lg p-item ${isUnread ? 'bg-muted' : 'bg-background'}`}
          onPress={() => router.push(`/inbox/${item.id}`)}
          accessibilityRole="button"
        >
          <View className="mr-md relative">
            <ProfileAvatar uri={item.counterparty_avatar_url ?? undefined} name={title} size="md" />
            {activity.isActive && (
              <View
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-verified"
                style={{ borderWidth: 2, borderColor: colors.card }}
              />
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-center">
              <Text
                className={`text-body font-semibold flex-1 mr-sm ${isUnread ? 'text-primary-deep font-bold' : 'text-foreground'}`}
                numberOfLines={1}
              >
                {title}
              </Text>
              {item.last_message_at && (
                <Text
                  className={`text-micro ${isUnread ? 'text-primary-deep font-bold' : 'text-muted-foreground'}`}
                >
                  {formatTimestamp(item.last_message_at)}
                </Text>
              )}
            </View>
            {item.last_message_content && (
              <Text className="text-label text-muted-foreground mt-[2px]" numberOfLines={1}>
                {item.last_message_content}
              </Text>
            )}
          </View>
          {isUnread && (
            <View className="w-[10px] h-[10px] rounded-full items-center justify-center ml-sm">
              <View className="w-[10px] h-[10px] rounded-full bg-secondary" />
            </View>
          )}
        </Pressable>
      );
    },
    [formatTimestamp, router, t],
  );

  return (
    <FeedListTemplate
      testID="SCR-SHARED-010"
      data={filteredConversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isError={isError}
      isEmpty={filteredConversations.length === 0}
      onRefresh={refetch}
      isRefreshing={isRefetching}
      onRetry={refetch}
      emptyTitle={t('shared.inbox.emptyTitle')}
      emptyDescription={t('shared.inbox.emptyDescription')}
      errorMessage={t('shared.inbox.errorMessage')}
      retryLabel={t('shared.inbox.retry')}
      filterBar={filterBar}
      ListHeaderComponent={listHeader}
    />
  );
}
