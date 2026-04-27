import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevations, overlays } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

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
  headerLeading?: ReactNode;
  headerTrailing?: ReactNode;
  footer?: ReactNode;
  hideDefaultAction?: boolean;
  titleAlign?: 'left' | 'center';
  dismissible?: boolean;
  className?: string;
  contentClassName?: string;
  testID?: string;
};

export function ModalSheet({
  visible,
  title,
  onClose,
  children,
  primaryAction,
  secondaryAction,
  headerLeading,
  headerTrailing,
  footer,
  hideDefaultAction = false,
  titleAlign = 'left',
  dismissible = true,
  className,
  contentClassName,
  testID,
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
          className={cn('bg-card rounded-tl-lg rounded-tr-lg px-lg py-xl gap-md', className)}
          style={[elevations.elevated, { paddingBottom: insets.bottom + mobileTheme.spacing.xl }]}
          testID={testID}
        >
          <View className="self-center w-11 h-[5px] rounded-full bg-muted" />
          <View className="flex-row items-center">
            {headerLeading ? (
              <View className="w-9 items-start">{headerLeading}</View>
            ) : titleAlign === 'center' && headerTrailing ? (
              <View className="w-9" />
            ) : null}
            <Text
              className={cn(
                'text-body font-sans-bold text-foreground',
                titleAlign === 'center' && 'flex-1 text-center',
              )}
            >
              {title}
            </Text>
            {headerTrailing ? (
              <View className="w-9 items-end">{headerTrailing}</View>
            ) : headerLeading && titleAlign === 'center' ? (
              <View className="w-9" />
            ) : null}
          </View>
          <View className={cn('gap-sm', contentClassName)}>{children}</View>
          {footer ? (
            footer
          ) : primaryAction || secondaryAction ? (
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
          ) : hideDefaultAction ? null : (
            <Button label={t('common.close')} variant="secondary" onPress={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}
