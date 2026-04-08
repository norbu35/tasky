import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

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
      <View style={styles.content}>
        <Text style={styles.title}>{t('shared.review.reminderTitle')}</Text>
        <Text style={styles.body}>
          {t('ReviewReminder.copy1')}
        </Text>

        <Button
          label={t('shared.review.reminderCta')}
          onPress={handleReviewNow}
          style={styles.ctaButton}
          testID="review-reminder-cta"
        />

        <Button
          label={t('shared.review.reminderLater')}
          variant="ghost"
          onPress={onDismiss}
          style={styles.laterButton}
          testID="review-reminder-later"
        />
      </View>
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: typography.body * 1.5,
  },
  ctaButton: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  laterButton: {
    alignSelf: 'stretch',
  },
});
