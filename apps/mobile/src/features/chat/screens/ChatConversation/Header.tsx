import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors, radius, spacing } = mobileTheme;

export function ChatHeader({
  counterpartyName,
  counterpartyAvatarUrl,
  onBack,
  t,
}: {
  counterpartyName?: string;
  counterpartyAvatarUrl?: string;
  onBack: () => void;
  t: (key: string) => string;
}) {
  const title = counterpartyName ?? t('shared.inbox.chatTitle');

  return (
    <View
      className="bg-card"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
      }}
    >
      <Touchable
        onPress={onBack}
        className="absolute left-lg top-md w-11 h-11 justify-center items-center"
        testID="chat-back"
      >
        <ChevronLeft size={28} color={colors.foreground} />
      </Touchable>

      <Touchable
        testID="chat-details-button"
        accessibilityLabel={t('shared.inbox.detailsAction')}
        className="absolute right-lg top-md h-11 justify-center items-center"
        style={{
          minWidth: 96,
          borderRadius: radius.full,
          backgroundColor: colors.muted,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Text className="text-body font-sans-semibold" style={{ color: colors.foreground }}>
          {t('shared.inbox.detailsAction')}
        </Text>
      </Touchable>

      <View className="items-center" style={{ paddingTop: spacing.xs }}>
        <ProfileAvatar uri={counterpartyAvatarUrl} name={title} size="lg" />
        <Text
          className="mt-sm text-subtitle font-sans-semibold text-center"
          numberOfLines={1}
          style={{ color: colors.foreground, maxWidth: 240 }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
