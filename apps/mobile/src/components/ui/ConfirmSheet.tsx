import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  testID?: string;
  className?: string;
}

export function ConfirmSheet({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  isDestructive = false,
  testID,
  className,
}: ConfirmSheetProps) {
  const { t } = useTranslation();

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      testID={testID}
      className={className}
      snapPoints={['40%', '55%']}
      primaryAction={{
        label: confirmLabel,
        onPress: () => {
          onConfirm();
          onClose();
        },
      }}
      secondaryAction={{
        label: t('common.cancel'),
        onPress: onClose,
      }}
    >
      <View className="items-center gap-sm">
        {isDestructive && <AlertTriangle size={24} color={colors.danger} />}
        <Text className="text-title font-sans-bold text-foreground text-center">{title}</Text>
        <Text className="text-body text-muted-foreground text-center leading-6">{description}</Text>
      </View>
    </ModalSheetTemplate>
  );
}
