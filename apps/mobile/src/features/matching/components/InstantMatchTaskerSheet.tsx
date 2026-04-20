import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { elevations, overlays } from '@/design/elevations';

interface InstantMatchTaskerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  budgetLabel?: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

const DEFAULT_BUDGET_LABEL = '₮45,000';
const DEFAULT_TIME_REMAINING = '5:00';

export function InstantMatchTaskerSheet({
  isOpen,
  onClose,
  taskTitle,
  budgetLabel = DEFAULT_BUDGET_LABEL,
  onAccept,
  onDecline,
}: InstantMatchTaskerSheetProps) {
  const { t } = useTranslation();
  const [isAccepted, setIsAccepted] = React.useState(false);
  const resolvedTaskTitle = taskTitle ?? t('InstantMatchTaskerSheet.copy1');

  React.useEffect(() => {
    if (!isOpen) {
      setIsAccepted(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    setIsAccepted(false);
  }, [resolvedTaskTitle, budgetLabel]);

  if (!isOpen) return null;

  const handleAccept = () => {
    setIsAccepted(true);
    onAccept?.();
  };

  const handleDecline = () => {
    onDecline?.();
    onClose();
  };

  if (isAccepted) {
    return (
      <View className="justify-end" style={{ backgroundColor: overlays.sheet }}>
        <View
          className="bg-background rounded-t-lg p-xl gap-md"
          style={elevations.elevated}
          testID="instant-match-sheet"
        >
          <Text className="text-title font-bold text-primary-deep text-center">
            {t('matching.instantMatch.successTitle')}
          </Text>
          <Text className="text-body text-text-secondary text-center">
            {t('InstantMatchTaskerSheet.copy2')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="justify-end" style={{ backgroundColor: overlays.sheet }}>
      <View
        className="bg-background rounded-t-lg p-xl gap-md"
        style={elevations.elevated}
        testID="instant-match-sheet"
      >
        <View className="w-12 h-[5px] rounded-full bg-border self-center" />
        <Text className="text-title font-bold text-primary-deep text-center">
          {t('matching.instantMatch.newOfferTitle')}
        </Text>
        <Text className="text-body text-text-secondary text-center">
          {t('matching.instantMatch.newOfferDescription')}
        </Text>
        <View className="bg-card rounded-md p-lg gap-sm" style={elevations.card}>
          <Text className="text-body font-bold text-primary-deep">{resolvedTaskTitle}</Text>
          <Text className="text-label text-text-secondary">{budgetLabel}</Text>
          <Text className="text-label font-bold text-primary-deep">{DEFAULT_TIME_REMAINING}</Text>
        </View>
        <Button
          testID="instant-match-accept"
          label={t('matching.instantMatch.acceptButton')}
          onPress={handleAccept}
          style={elevations.fab}
        />
        <Button
          label={t('matching.instantMatch.declineButton')}
          variant="ghost"
          onPress={handleDecline}
        />
      </View>
    </View>
  );
}
