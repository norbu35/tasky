import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Briefcase, ChevronLeft, Paperclip, ShieldAlert } from 'lucide-react-native';
import { useMessages } from '../../../features/chat/hooks/useMessages';
import { useSendMessage } from '../../../features/chat/hooks/useSendMessage';
import { ErrorStateTemplate } from '../../../components/templates/ErrorStateTemplate';
import { Input } from '../../../components/ui/Input';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { useAuthStore } from '../../../store/authStore';
import { elevations, mobileTheme } from '../../../design/tokenAdapter';

const { colors } = mobileTheme;

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
  const profile = useAuthStore((s) => s.profile);
  const myId = profile?.id;

  const { data, isLoading, isError, refetch } = useMessages(id ?? '');
  const { mutate: sendMessage, isPending } = useSendMessage();

  const [draft, setDraft] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const messages: MessageItem[] = data?.data ?? [];
  const showPhoneWarning = PHONE_REGEX.test(draft);

  const activeTask = useMemo(
    () => ({
      title: t('shared.inbox.contextTitle'),
      subtitle: t('shared.inbox.contextSubtitle'),
      status: t('shared.inbox.contextStatus'),
    }),
    [t],
  );

  const handleSend = useCallback(() => {
    if (!id || draft.trim().length === 0) return;
    sendMessage({ conversationId: id, content: draft.trim() });
    setDraft('');
  }, [draft, id, sendMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => {
      const isMine = item.sender_id === myId;
      const timestamp = new Date(item.created_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });

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
          </View>
        </View>
      );
    },
    [myId],
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background" testID="chat-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        testID="SCR-SHARED-011"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-row items-center justify-between pt-lg pb-md px-lg bg-card">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 justify-center items-center"
            testID="chat-back"
          >
            <ChevronLeft size={24} color={colors.primary} />
          </Pressable>
          <View className="flex-1 items-center">
            <Text className="text-subtitle font-bold text-foreground" numberOfLines={1}>
              {t('shared.inbox.chatTitle')}
            </Text>
            <View className="flex-row items-center gap-xs" style={{ marginTop: 2 }}>
              <View className="w-2 h-2 rounded-full bg-verified" />
              <Text className="text-micro text-mutedForeground">{t('shared.inbox.online')}</Text>
            </View>
          </View>
          <View className="w-10 items-end">
            <ProfileAvatar uri={profile?.avatar_url} name={profile?.full_name ?? 'T'} size="sm" />
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
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      testID="SCR-SHARED-011"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="flex-row items-center justify-between pt-lg pb-md px-lg bg-card">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 justify-center items-center"
          testID="chat-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-subtitle font-bold text-foreground" numberOfLines={1}>
            {t('shared.inbox.chatTitle')}
          </Text>
          <View className="flex-row items-center gap-xs" style={{ marginTop: 2 }}>
            <View className="w-2 h-2 rounded-full bg-verified" />
            <Text className="text-micro text-mutedForeground">{t('shared.inbox.online')}</Text>
          </View>
        </View>
        <View className="w-10 items-end">
          <ProfileAvatar uri={profile?.avatar_url} name={profile?.full_name ?? 'T'} size="sm" />
        </View>
      </View>

      {/* contextCard: shadow → imperative */}
      <View
        className="flex-row items-center gap-md mx-lg mt-md p-md rounded-lg bg-card"
        style={elevations.card}
      >
        <View className="w-10 h-10 rounded-md bg-primary items-center justify-center">
          <Briefcase size={18} color={colors.primaryForeground} />
        </View>
        <View className="flex-1" style={{ gap: 2 }}>
          <Text
            className="text-micro font-bold text-mutedForeground uppercase"
            style={{ letterSpacing: 0.8 }}
          >
            {activeTask.title}
          </Text>
          <Text className="text-body font-bold text-foreground" numberOfLines={2}>
            {activeTask.subtitle}
          </Text>
        </View>
        <View className="px-sm py-xs rounded-full bg-accent">
          <Text className="text-micro font-bold text-primary">{activeTask.status}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-sm mt-md mx-lg px-md py-sm rounded-md bg-secondary">
        <ShieldAlert size={16} color={colors.primary} />
        <Text className="flex-1 text-label text-foreground">{t('ChatDetailScreen.copy1')}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={<View style={{ height: 24 }} />}
      />

      {showPhoneWarning && (
        <View testID="phone-warning" className="bg-secondary py-sm px-md">
          <Text className="text-label text-foreground text-center">
            {t('ChatDetailScreen.copy2')}
          </Text>
        </View>
      )}

      {/* inputBar: Platform.OS conditional paddingBottom → imperative */}
      <View
        className="flex-row gap-sm px-lg pt-md bg-card border-t border-border items-center"
        style={{ paddingBottom: Platform.OS === 'ios' ? 24 : 12 }}
      >
        <Pressable
          className="w-10 h-10 rounded-md bg-muted items-center justify-center"
          accessibilityRole="button"
        >
          <Paperclip size={18} color={colors.foreground} />
        </Pressable>
        <Input
          testID="chat-input"
          style={{
            flex: 1,
            backgroundColor: colors.muted,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            color: colors.foreground,
            maxHeight: 96,
            fontSize: 16,
          }}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('shared.inbox.sendPlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          maxLength={500}
          multiline
        />
        <Pressable
          testID="chat-send-button"
          style={({ pressed }) => [
            {
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.primary,
              borderRadius: 12,
            },
            draft.trim().length === 0 && { opacity: 0.5 },
            pressed && draft.trim().length > 0 && { opacity: 0.85 },
          ]}
          onPress={handleSend}
          disabled={draft.trim().length === 0 || isPending}
        >
          <Text className="text-primaryForeground font-bold text-body">{t('chat.send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
