import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

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
