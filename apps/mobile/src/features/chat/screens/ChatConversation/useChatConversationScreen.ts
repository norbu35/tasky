import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';

import { useConversations } from '@/features/chat/hooks/useConversations';
import { useMessages } from '@/features/chat/hooks/useMessages';
import { useSendMessage } from '@/features/chat/hooks/useSendMessage';
import { useMyUserId } from '@/features/profile';

import { type MessageItem, orderMessagesChronologically, PHONE_REGEX } from './model';

export function useChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const myId = useMyUserId();

  const { data, isLoading, isError, refetch } = useMessages(id ?? '');
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { data: conversationsData } = useConversations();
  const conversation = useMemo(
    () => conversationsData?.data?.find((c: { id: string }) => c.id === id),
    [conversationsData, id],
  );

  const [draft, setDraft] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const messages: MessageItem[] = useMemo(
    () => orderMessagesChronologically(data?.data ?? []),
    [data?.data],
  );
  const showPhoneWarning = PHONE_REGEX.test(draft);

  const handleSend = useCallback(() => {
    if (!id || draft.trim().length === 0) return;
    sendMessage({ conversationId: id, content: draft.trim() });
    setDraft('');
  }, [draft, id, sendMessage]);

  const handleAttachImage = useCallback(() => {
    // UI placeholder for the next pass, where image picking and upload will be wired.
  }, []);

  return {
    id,
    router,
    t,
    myId,
    conversation,
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
    handleAttachImage,
  };
}
