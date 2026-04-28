import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { cn } from '@/lib/cn';

export interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onPress: () => void;
}

export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ActionSheetAction[];
  testID?: string;
  className?: string;
}

export function ActionSheet({ isOpen, onClose, actions, testID, className }: ActionSheetProps) {
  const { t } = useTranslation();

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      testID={testID}
      className={className}
      snapPoints={['40%', '55%']}
      hideDefaultAction
    >
      <View className="gap-0">
        {actions.map((action, index) => (
          <Pressable
            key={index}
            className={cn(
              'flex-row items-center px-lg py-md min-h-touch-lg',
              index < actions.length - 1 && 'border-b border-border',
            )}
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
          className="items-center py-md mt-sm border-t border-border"
          onPress={onClose}
          accessibilityRole="button"
        >
          <Text className="text-body font-sans-semibold text-muted-foreground">
            {t('common.cancel')}
          </Text>
        </Pressable>
      </View>
    </ModalSheetTemplate>
  );
}
