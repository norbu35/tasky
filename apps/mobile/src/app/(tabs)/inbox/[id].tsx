import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/components/shells/ScreenContainer';
import { ErrorStateTemplate } from '@/components/templates/ErrorStateTemplate';
import { Input } from '@/components/ui/Input';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';
import { useConversations } from '@/features/chat/hooks/useConversations';
import { useMessages } from '@/features/chat/hooks/useMessages';
import { useSendMessage } from '@/features/chat/hooks/useSendMessage';
import { formatLastActive } from '@/lib/formatLastActive';
import { useAuthStore } from '@/store/authStore';

const { colors, spacing, radius, typography } = mobileTheme;

const PHONE_REGEX = /(\+?976)?[\s-]?\d{4}[\s-]?\d{4}|\d{8,}/;

interface MessageItem {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  const messages: MessageItem[] = data?.data ?? [];
  const showPhoneWarning = PHONE_REGEX.test(draft);

  const handleSend = useCallback(() => {
    if (!id || draft.trim().length === 0) return;
    sendMessage({ conversationId: id, content: draft.trim() });
    setDraft('');
  }, [draft, id, sendMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => {
      const isMine = item.sender_id === myId;
      const date = new Date(item.created_at);
      const timestamp = isNaN(date.getTime())
        ? ''
        : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

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
    },
    [myId],
  );

  if (isLoading) {
    return (
      <ScreenContainer testID="chat-loading">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer testID="SCR-SHARED-011" padded={false}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View className="flex-row items-center justify-between pb-md px-lg bg-card">
            <Touchable
              onPress={() => router.back()}
              className="w-10 h-10 justify-center items-center"
              testID="chat-back"
            >
              <ChevronLeft size={24} color={colors.primary} />
            </Touchable>
            <View className="flex-1 items-center">
              <Text className="text-subtitle font-bold text-foreground" numberOfLines={1}>
                {conversation?.counterparty_name ?? t('shared.inbox.chatTitle')}
              </Text>
              {activity.label && (
                <View className="flex-row items-center gap-xs" style={{ marginTop: 2 }}>
                  {activity.isActive && <View className="w-2 h-2 rounded-full bg-verified" />}
                  <Text className="text-micro text-muted-foreground">{activity.label}</Text>
                </View>
              )}
            </View>
            <View className="w-10 items-end">
              <ProfileAvatar
                uri={conversation?.counterparty_avatar_url ?? undefined}
                name={conversation?.counterparty_name ?? 'T'}
                size="sm"
              />
            </View>
          </View>
          <ErrorStateTemplate
            message={t('shared.inbox.errorMessage')}
            retryLabel={t('shared.inbox.retry')}
            onRetry={() => {
              void refetch();
            }}
            testID="chat-detail-error"
          />
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="SCR-SHARED-011" padded={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-row items-center justify-between pb-md px-lg bg-card">
          <Touchable
            onPress={() => router.back()}
            className="w-10 h-10 justify-center items-center"
            testID="chat-back"
          >
            <ChevronLeft size={24} color={colors.primary} />
          </Touchable>
          <View className="flex-1 items-center">
            <Text className="text-subtitle font-bold text-foreground" numberOfLines={1}>
              {conversation?.counterparty_name ?? t('shared.inbox.chatTitle')}
            </Text>
            {activity.label && (
              <View className="flex-row items-center gap-xs" style={{ marginTop: 2 }}>
                {activity.isActive && <View className="w-2 h-2 rounded-full bg-verified" />}
                <Text className="text-micro text-muted-foreground">{activity.label}</Text>
              </View>
            )}
          </View>
          <View className="w-10 items-end">
            <ProfileAvatar
              uri={conversation?.counterparty_avatar_url ?? undefined}
              name={conversation?.counterparty_name ?? 'T'}
              size="sm"
            />
          </View>
        </View>

        <FlatList
          style={{ flex: 1 }}
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xl,
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {showPhoneWarning && (
          <View testID="phone-warning" className="bg-secondary py-sm px-md">
            <Text className="text-label text-foreground text-center">
              {t('ChatDetailScreen.copy2')}
            </Text>
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: spacing.sm,
            paddingHorizontal: screenLayout.insetX,
            paddingTop: screenLayout.actions.barPadding,
            paddingBottom: insets.bottom + screenLayout.actions.barPadding,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Input
            testID="chat-input"
            style={{
              flex: 1,
              backgroundColor: colors.muted,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm + 2,
              fontSize: typography.body,
              color: colors.foreground,
              maxHeight: spacing['3xl'] * 2.5,
            }}
            value={draft}
            onChangeText={setDraft}
            placeholder={t('shared.inbox.sendPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            maxLength={500}
            multiline
          />
          <Touchable
            testID="chat-send-button"
            onPress={handleSend}
            disabled={draft.trim().length === 0 || isPending}
            style={{
              width: spacing['3xl'],
              height: spacing['3xl'],
              borderRadius: radius.full,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: draft.trim().length === 0 ? 0.4 : 1,
            }}
          >
            <Send size={20} color={colors.primaryForeground} />
          </Touchable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
