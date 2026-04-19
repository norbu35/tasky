import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevations, overlays } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ActionSheetAction[];
  testID?: string;
  className?: string;
}

export function ActionSheet({ isOpen, onClose, actions, testID, className }: ActionSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={isOpen} onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: overlays.sheet }}>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="action-sheet-backdrop"
        />
        <View
          className={cn('bg-card rounded-tl-lg rounded-tr-lg pt-sm', className)}
          style={[elevations.elevated, { paddingBottom: insets.bottom + mobileTheme.spacing.lg }]}
          testID={testID}
        >
          {actions.map((action, index) => (
            <Pressable
              key={index}
              className="flex-row items-center px-lg py-md min-h-[48px]"
              style={
                index < actions.length - 1
                  ? {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: mobileTheme.colors.border,
                    }
                  : undefined
              }
              onPress={() => {
                action.onPress();
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              {action.icon && <View className="mr-md">{action.icon}</View>}
              <Text
                className={cn(
                  'text-body font-sans text-foreground',
                  action.destructive && 'text-danger',
                )}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            className="items-center py-md mt-sm"
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: mobileTheme.colors.border,
            }}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text className="text-body font-sans-semibold text-muted-foreground">
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
