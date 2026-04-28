import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
interface ReviewReminderProps {
  isOpen: boolean;
  onDismiss: () => void;
  bookingId: string;
}

export function ReviewReminder({ isOpen, onDismiss, bookingId }: ReviewReminderProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleReviewNow = () => {
    onDismiss();
    router.push(`/(shared)/review/${bookingId}`);
  };

  return (
    <ModalSheetTemplate isOpen={isOpen} onClose={onDismiss} testID="review-reminder">
      <View className="items-center gap-md">
        <Text className="text-title font-sans-bold text-foreground text-center">
          {t('shared.review.reminderTitle')}
        </Text>
        <Text className="text-body text-muted-foreground text-center leading-normal">
          {t('ReviewReminder.copy1')}
        </Text>

        <Button
          label={t('shared.review.reminderCta')}
          onPress={handleReviewNow}
          className="mt-sm"
          style={{ alignSelf: 'stretch' }}
          testID="review-reminder-cta"
        />

        <Button
          label={t('shared.review.reminderLater')}
          variant="ghost"
          onPress={onDismiss}
          style={{ alignSelf: 'stretch' }}
          testID="review-reminder-later"
        />
      </View>
    </ModalSheetTemplate>
  );
}
