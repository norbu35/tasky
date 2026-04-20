import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';

import { ScreenContainer } from '@/components/shells/ScreenContainer';
import { ErrorStateTemplate } from '@/components/templates/ErrorStateTemplate';
import { mobileTheme } from '@/design/tokenAdapter';

import { ChatHeader } from './Header';
import { InputBar } from './InputBar';
import { MessageBubble } from './MessageBubble';
import { PhoneWarning } from './PhoneWarning';
import { useChatConversationScreen } from './useChatConversationScreen';

const { colors, spacing } = mobileTheme;

export default function ChatConversationScreen() {
  const {
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
  } = useChatConversationScreen();

  const renderMessage = useCallback(
    ({ item }: { item: import('./model').MessageItem }) => (
      <MessageBubble item={item} myId={myId} />
    ),
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

  const headerProps = {
    counterpartyName: conversation?.counterparty_name,
    counterpartyAvatarUrl: conversation?.counterparty_avatar_url ?? undefined,
    activityLabel: activity.label,
    isActive: activity.isActive,
    onBack: () => router.back(),
    t,
  };

  if (isError) {
    return (
      <ScreenContainer testID="SCR-SHARED-011" padded={false}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ChatHeader {...headerProps} />
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
        <ChatHeader {...headerProps} />
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
        {showPhoneWarning && <PhoneWarning text={t('ChatDetailScreen.copy2')} />}
        <InputBar
          draft={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          isPending={isPending}
          placeholder={t('shared.inbox.sendPlaceholder')}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
