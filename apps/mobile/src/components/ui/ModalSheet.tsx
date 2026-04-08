import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../../design/tokenAdapter';
import { overlays } from '../../design/elevations';
import { cn } from '../../lib/cn';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    testID?: string;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
    testID?: string;
  };
  dismissible?: boolean;
  className?: string;
};

export function ModalSheet({
  visible,
  title,
  onClose,
  children,
  primaryAction,
  secondaryAction,
  dismissible = true,
  className,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: overlays.sheet }}>
        {dismissible ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
            testID="modal-sheet-backdrop"
          />
        ) : (
          <View style={StyleSheet.absoluteFill} pointerEvents="none" />
        )}
        <View
          className={cn('bg-background rounded-tl-lg rounded-tr-lg px-lg py-xl gap-md', className)}
          style={{ paddingBottom: insets.bottom + mobileTheme.spacing.xl }}
        >
          <View className="self-center w-11 h-[5px] rounded-full bg-border" />
          <Text className="text-body font-sans-bold text-foreground">{title}</Text>
          <View className="gap-sm">{children}</View>
          {primaryAction || secondaryAction ? (
            <View className="gap-sm">
              {primaryAction ? (
                <Button
                  label={primaryAction.label}
                  onPress={primaryAction.onPress}
                  testID={primaryAction.testID}
                />
              ) : null}
              {secondaryAction ? (
                <Button
                  label={secondaryAction.label}
                  variant="secondary"
                  onPress={secondaryAction.onPress}
                  testID={secondaryAction.testID}
                />
              ) : null}
            </View>
          ) : (
            <Button label={t('common.close')} variant="secondary" onPress={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}
