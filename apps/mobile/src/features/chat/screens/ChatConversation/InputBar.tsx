import { Send } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

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
