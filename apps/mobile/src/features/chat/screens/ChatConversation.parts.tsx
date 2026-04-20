import { ChevronLeft, Send } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input } from '@/components/ui/Input';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';

import { type MessageItem, formatMessageTimestamp } from './ChatConversation.model';

const { colors, spacing, radius, typography } = mobileTheme;

export function ChatHeader({
  counterpartyName,
  counterpartyAvatarUrl,
  activityLabel,
  isActive,
  onBack,
  t,
}: {
  counterpartyName?: string;
  counterpartyAvatarUrl?: string;
  activityLabel: string | null;
  isActive: boolean;
  onBack: () => void;
  t: (key: string) => string;
}) {
  return (
    <View className="flex-row items-center justify-between pb-md px-lg bg-card">
      <Touchable
        onPress={onBack}
        className="w-10 h-10 justify-center items-center"
        testID="chat-back"
      >
        <ChevronLeft size={24} color={colors.primary} />
      </Touchable>
      <View className="flex-1 items-center">
        <Text className="text-subtitle font-bold text-foreground" numberOfLines={1}>
          {counterpartyName ?? t('shared.inbox.chatTitle')}
        </Text>
        {activityLabel && (
          <View className="flex-row items-center gap-xs" style={{ marginTop: 2 }}>
            {isActive && <View className="w-2 h-2 rounded-full bg-verified" />}
            <Text className="text-micro text-muted-foreground">{activityLabel}</Text>
          </View>
        )}
      </View>
      <View className="w-10 items-end">
        <ProfileAvatar uri={counterpartyAvatarUrl} name={counterpartyName ?? 'T'} size="sm" />
      </View>
    </View>
  );
}

export function MessageBubble({ item, myId }: { item: MessageItem; myId?: string }) {
  const isMine = item.sender_id === myId;
  const timestamp = formatMessageTimestamp(item.created_at);

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
}

export function PhoneWarning({ text }: { text: string }) {
  return (
    <View testID="phone-warning" className="bg-secondary py-sm px-md">
      <Text className="text-label text-foreground text-center">{text}</Text>
    </View>
  );
}

export function InputBar({
  draft,
  onChangeText,
  onSend,
  isPending,
  placeholder,
}: {
  draft: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isPending: boolean;
  placeholder: string;
}) {
  const insets = useSafeAreaInsets();

  return (
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
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        maxLength={500}
        multiline
      />
      <Touchable
        testID="chat-send-button"
        onPress={onSend}
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
  );
}
