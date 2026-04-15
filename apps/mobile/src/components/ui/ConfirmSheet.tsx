import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { overlays } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

import { Button } from './Button';

const { colors, spacing } = mobileTheme;

interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  isDestructive?: boolean;
  testID?: string;
  className?: string;
}

export function ConfirmSheet({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
  isDestructive = false,
  testID,
  className,
}: ConfirmSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={isOpen} onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: overlays.sheet }}>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="confirm-sheet-backdrop"
        />
        <View
          className={cn('bg-card rounded-tl-lg rounded-tr-lg px-lg py-xl items-center', className)}
          style={{ paddingBottom: insets.bottom + spacing.xl }}
          testID={testID}
        >
          {isDestructive && (
            <View className="mb-md">
              <AlertTriangle size={32} color={colors.danger} />
            </View>
          )}
          <Text className="text-title font-sans-bold text-foreground text-center mb-sm">
            {title}
          </Text>
          <Text
            className="text-body text-muted-foreground text-center mb-xl"
            style={{ lineHeight: 22 }}
          >
            {description}
          </Text>
          <View className="self-stretch gap-sm">
            <Button
              label={confirmLabel}
              variant={isDestructive ? 'destructive' : 'default'}
              onPress={() => {
                onConfirm();
                onClose();
              }}
              className="self-stretch"
              accessibilityLabel={confirmLabel}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={onClose}
              className="self-stretch"
              accessibilityLabel={t('common.cancel')}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
