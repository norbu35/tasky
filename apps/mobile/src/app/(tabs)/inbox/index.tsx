import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { useConversations } from '../../../features/chat/hooks/useConversations';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { Input } from '../../../components/ui/Input';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { elevations, mobileTheme } from '../../../design/tokenAdapter';
import { screenLayout } from '../../../design/screenLayout';

const { colors } = mobileTheme;

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
    <View
      style={{
        paddingHorizontal: screenLayout.insetX,
        paddingTop: screenLayout.header.topInset,
        paddingBottom: screenLayout.body.itemGap,
        gap: screenLayout.body.itemGap,
      }}
    >
      <View className="flex-row items-center justify-start">
        <Text className="text-heading font-sans-bold text-primaryDeep">
          {t('shared.inbox.title', 'Чат')}
        </Text>
      </View>
    </View>
  );

  const filterBar =
    !isLoading && !isError ? (
      <View
        className="flex-row items-center gap-sm bg-card rounded-lg px-md py-sm border border-border"
        style={elevations.card}
      >
        <Search size={18} color={colors.textTertiary} />
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('shared.inbox.searchPlaceholder', 'Хайх...')}
          placeholderTextColor={colors.textTertiary}
          className="flex-1 text-body text-foreground"
          style={{ paddingVertical: 2 }}
          testID="conversation-search-input"
        />
      </View>
    ) : null;

  const renderItem = useCallback(
    (item: ConversationItem) => {
      const title =
        item.counterparty_name ?? item.task_title ?? t('messaging.taskDiscussion', 'Чат');
      const isUnread = (item.unread_count ?? 0) > 0;
      return (
        <Pressable
          testID={`conversation-row-${item.id}`}
          className={`flex-row items-center rounded-lg p-item ${isUnread ? 'bg-muted' : 'bg-background'}`}
          onPress={() => router.push(`/inbox/${item.id}`)}
          accessibilityRole="button"
        >
          <View className="mr-md">
            <ProfileAvatar uri={item.counterparty_avatar_url ?? undefined} name={title} size="md" />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-center">
              <Text
                className={`text-body font-semibold flex-1 mr-sm ${isUnread ? 'text-primaryDeep font-bold' : 'text-foreground'}`}
                numberOfLines={1}
              >
                {title}
              </Text>
              {item.last_message_at && (
                <Text
                  className={`text-micro ${isUnread ? 'text-primaryDeep font-bold' : 'text-mutedForeground'}`}
                >
                  {formatTimestamp(item.last_message_at)}
                </Text>
              )}
            </View>
            {item.last_message_preview && (
              <Text className="text-label text-mutedForeground mt-[2px]" numberOfLines={1}>
                {item.last_message_preview}
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
      emptyTitle={t('shared.inbox.emptyTitle', 'Мессеж байхгүй')}
      emptyDescription={t(
        'shared.inbox.emptyDescription',
        'Захиалга хийсний дараа энд мессежүүд харагдана',
      )}
      errorMessage={t('shared.inbox.errorMessage', 'Мессежүүдийг ачаалж чадсангүй')}
      retryLabel={t('shared.inbox.retry', 'Дахин оролдох')}
      filterBar={filterBar}
      ListHeaderComponent={listHeader}
    />
  );
}
