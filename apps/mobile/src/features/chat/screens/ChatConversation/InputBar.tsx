import { Image, Send } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

export function InputBar({
  draft,
  onChangeText,
  onSend,
  onAttachImage,
  isPending,
  placeholder,
  attachImageLabel,
}: {
  draft: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachImage: () => void;
  isPending: boolean;
  placeholder: string;
  attachImageLabel: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: screenLayout.insetX,
        paddingTop: spacing.sm,
        paddingBottom: insets.bottom + spacing.xl,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.card,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: 34,
          ...elevations.soft,
        }}
      >
        <Touchable
          testID="chat-attach-image-button"
          accessibilityLabel={attachImageLabel}
          onPress={onAttachImage}
          style={{
            width: spacing['3xl'],
            height: spacing['3xl'],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image size={28} color={colors.foreground} />
        </Touchable>
        <Input
          testID="chat-input"
          style={{
            flex: 1,
            minHeight: spacing['3xl'],
            backgroundColor: colors.card,
            borderWidth: 0,
            borderRadius: radius.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm + 2,
            fontSize: typography.subtitle,
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
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: draft.trim().length === 0 ? 0.4 : 1,
          }}
        >
          <Send
            size={22}
            color={draft.trim().length === 0 ? colors.mutedForeground : colors.primary}
          />
        </Touchable>
      </View>
    </View>
  );
}
