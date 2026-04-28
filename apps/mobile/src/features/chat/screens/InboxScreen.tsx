import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FeedListTemplate } from '@/components/templates/FeedListTemplate';
import { useConversations } from '@/features/chat/hooks/useConversations';

import { ConversationRow } from './Inbox.ConversationRow';
import { InboxHeader, type InboxFilter } from './Inbox.Header';
import type { ConversationItem } from './Inbox.model';

export default function InboxScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useConversations();
  const [search, setSearch] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');

  const conversations = useMemo<ConversationItem[]>(() => data?.data ?? [], [data?.data]);
  const filteredConversations = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) => {
      const aTime = new Date(a.last_message_at ?? a.created_at).getTime();
      const bTime = new Date(b.last_message_at ?? b.created_at).getTime();
      return bTime - aTime;
    });

    const filteredByChip = sorted.filter((item) => {
      if (activeFilter === 'unread') return (item.unread_count ?? 0) > 0;
      if (activeFilter === 'bookings') return Boolean(item.task_id);
      return true;
    });

    if (!normalizedQuery) return filteredByChip;

    return filteredByChip.filter((item) => {
      const haystack = [
        item.counterparty_name ?? '',
        item.last_message_content ?? '',
        item.task_title ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeFilter, conversations, search]);

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

  const handleToggleSearch = useCallback(() => {
    setIsSearchVisible((visible) => !visible);
  }, []);

  const handleOpenSettings = useCallback(() => {
    router.push('/(shared)/profile/settings');
  }, [router]);

  const listHeader = (
    <InboxHeader
      activeFilter={activeFilter}
      isSearchVisible={isSearchVisible}
      search={search}
      onOpenSettings={handleOpenSettings}
      onSearchChange={setSearch}
      onSelectFilter={setActiveFilter}
      onToggleSearch={handleToggleSearch}
    />
  );

  const renderItem = useCallback(
    (item: ConversationItem) => {
      return (
        <ConversationRow
          item={item}
          onPress={() => router.push(`/inbox/${item.id}`)}
          timestamp={formatTimestamp(item.last_message_at ?? item.created_at)}
        />
      );
    },
    [formatTimestamp, router],
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
      ListHeaderComponent={listHeader}
    />
  );
}
