import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';

import { useConversations } from '@/features/chat/hooks/useConversations';
import { useMessages } from '@/features/chat/hooks/useMessages';
import { useSendMessage } from '@/features/chat/hooks/useSendMessage';
import { formatLastActive } from '@/lib/formatLastActive';
import { useAuthStore } from '@/store/authStore';

import { type MessageItem, PHONE_REGEX } from './ChatConversation.model';

export function useChatConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const myId = profile?.id;

  const { data, isLoading, isError, refetch } = useMessages(id ?? '');
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { data: conversationsData } = useConversations();
  const conversation = useMemo(
    () => conversationsData?.data?.find((c: { id: string }) => c.id === id),
    [conversationsData, id],
  );
  const activity = formatLastActive(conversation?.counterparty_last_active_at);

  const [draft, setDraft] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const messages: MessageItem[] = useMemo(() => [...(data?.data ?? [])].reverse(), [data?.data]);
  const showPhoneWarning = PHONE_REGEX.test(draft);

  const handleSend = useCallback(() => {
    if (!id || draft.trim().length === 0) return;
    sendMessage({ conversationId: id, content: draft.trim() });
    setDraft('');
  }, [draft, id, sendMessage]);

  return {
    id,
    router,
    t,
    myId,
    conversation,
    activity,
    draft,
    setDraft,
    flatListRef,
    messages,
    showPhoneWarning,
    isLoading,
    isError,
    isPending,
    refetch,
    handleSend,
  };
}
