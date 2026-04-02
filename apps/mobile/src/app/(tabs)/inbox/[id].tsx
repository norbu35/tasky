import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Briefcase, ChevronLeft, Paperclip, ShieldAlert } from 'lucide-react-native';
import { useMessages } from '../../../features/chat/hooks/useMessages';
import { useSendMessage } from '../../../features/chat/hooks/useSendMessage';
import { ErrorStateTemplate } from '../../../components/templates/ErrorStateTemplate';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { useAuthStore } from '../../../store/authStore';
import { elevations, mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

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
      title: t('shared.inbox.contextTitle', 'Үйлчилгээ'),
      subtitle: t('shared.inbox.contextSubtitle', 'Захиалгын дэлгэрэнгүй'),
      status: t('shared.inbox.contextStatus', 'Баталгаажсан'),
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
          style={[styles.bubbleWrapper, isMine ? styles.bubbleRight : styles.bubbleLeft]}
        >
          <View
            testID={isMine ? `message-sent-${item.id}` : `message-received-${item.id}`}
            style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
          >
            <Text style={[styles.messageText, isMine ? styles.textMine : styles.textTheirs]}>
              {item.content}
            </Text>
            <Text
              testID={`message-timestamp-${item.id}`}
              style={[styles.timestamp, isMine ? styles.timestampMine : styles.timestampTheirs]}
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
      <View style={styles.center} testID="chat-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        testID="chat-detail"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="chat-back">
            <ChevronLeft size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.headerTitleShell}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t('shared.inbox.chatTitle', 'Чат')}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{t('shared.inbox.online', 'Онлайн')}</Text>
            </View>
          </View>
          <View style={styles.headerAvatarShell}>
            <ProfileAvatar uri={profile?.avatar_url} name={profile?.full_name ?? 'T'} size="sm" />
          </View>
        </View>
        <ErrorStateTemplate
          message={t('shared.inbox.errorMessage', 'Мессежүүдийг ачаалж чадсангүй')}
          retryLabel={t('shared.inbox.retry', 'Дахин оролдох')}
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
      style={styles.container}
      testID="chat-detail"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="chat-back">
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.headerTitleShell}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('shared.inbox.chatTitle', 'Чат')}
          </Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{t('shared.inbox.online', 'Онлайн')}</Text>
          </View>
        </View>
        <View style={styles.headerAvatarShell}>
          <ProfileAvatar uri={profile?.avatar_url} name={profile?.full_name ?? 'T'} size="sm" />
        </View>
      </View>

      <View style={styles.contextCard}>
        <View style={styles.contextIcon}>
          <Briefcase size={18} color={colors.primaryForeground} />
        </View>
        <View style={styles.contextBody}>
          <Text style={styles.contextLabel}>{activeTask.title}</Text>
          <Text style={styles.contextTitle} numberOfLines={2}>
            {activeTask.subtitle}
          </Text>
        </View>
        <View style={styles.contextStatusPill}>
          <Text style={styles.contextStatus}>{activeTask.status}</Text>
        </View>
      </View>

      <View style={styles.warningBanner}>
        <ShieldAlert size={16} color={colors.primary} />
        <Text style={styles.warningText}>
          {t(
            'shared.inbox.phoneWarning',
            'Аюулгүй байдлын үүднээс утасны дугаар болон хувийн мэдээлэл илгээхгүй байхыг зөвлөж байна',
          )}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={<View style={styles.listFooterSpacer} />}
      />

      {showPhoneWarning && (
        <View testID="phone-warning" style={styles.phoneWarning}>
          <Text style={styles.phoneWarningText}>
            {t(
              'shared.inbox.phoneWarning',
              'Аюулгүй байдлын үүднээс утасны дугаар болон хувийн мэдээлэл илгээхгүй байхыг зөвлөж байна',
            )}
          </Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <Pressable style={styles.attachButton} accessibilityRole="button">
          <Paperclip size={18} color={colors.foreground} />
        </Pressable>
        <TextInput
          testID="chat-input"
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('shared.inbox.sendPlaceholder', 'Мессеж бичих...')}
          placeholderTextColor={colors.mutedForeground}
          maxLength={500}
          multiline
        />
        <TouchableOpacity
          testID="chat-send-button"
          style={[styles.sendBtn, draft.trim().length === 0 && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={draft.trim().length === 0 || isPending}
        >
          <Text style={styles.sendBtnText}>{t('chat.send', 'Илгээх')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleShell: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.verified,
  },
  onlineText: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
  },
  headerAvatarShell: {
    width: 40,
    alignItems: 'flex-end',
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    ...elevations.card,
  },
  contextIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBody: {
    flex: 1,
    gap: 2,
  },
  contextLabel: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contextTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.foreground,
  },
  contextStatusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  contextStatus: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.primary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
  },
  warningText: {
    flex: 1,
    fontSize: typography.label,
    color: colors.foreground,
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listFooterSpacer: {
    height: spacing.xl,
  },
  bubbleWrapper: {
    width: '100%',
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: colors.muted,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: typography.body,
    lineHeight: 20,
  },
  textMine: {
    color: colors.primaryForeground,
  },
  textTheirs: {
    color: colors.foreground,
  },
  timestamp: {
    marginTop: spacing.xs,
    fontSize: typography.micro,
  },
  timestampMine: {
    color: colors.primaryForeground,
    opacity: 0.7,
    textAlign: 'right',
  },
  timestampTheirs: {
    color: colors.mutedForeground,
  },
  phoneWarning: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  phoneWarningText: {
    fontSize: typography.label,
    color: colors.foreground,
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    maxHeight: 96,
    fontSize: typography.body,
  },
  sendBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: typography.body,
  },
});
