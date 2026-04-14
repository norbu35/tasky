import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';
import type { PendingReview } from '../../../lib/mobileApiClient';

const { colors, radius, spacing, typography } = mobileTheme;

interface ReviewGateBannerProps {
  pendingReview: PendingReview;
}

export function ReviewGateBanner({ pendingReview }: ReviewGateBannerProps) {
  const { t } = useTranslation();

  const handlePress = () => {
    // Navigate to the review form
    router.push(`/(shared)/review/${pendingReview.booking_id}`);
  };

  const isHardBlocked =
    Date.now() - new Date(pendingReview.triggered_at).getTime() > 72 * 60 * 60 * 1000;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isHardBlocked
            ? t('reviewGate.hardLockedTitle', 'Review Required')
            : t('reviewGate.softLockedTitle', 'Pending Review')}
        </Text>
        <Text style={styles.body}>
          {isHardBlocked
            ? t(
                'reviewGate.hardLockedBody',
                'You must submit a review for your past booking before you can apply to new tasks or confirm new bookings.',
              )
            : t(
                'reviewGate.softLockedBody',
                'You have a pending review. Please submit it soon to keep the community safe.',
              )}
        </Text>
      </View>
      <Button
        label={t('reviewGate.cta', 'Submit Review')}
        variant={isHardBlocked ? 'default' : 'outline'}
        onPress={handlePress}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevations.card,
  },
  content: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  body: {
    fontSize: typography.body,
    lineHeight: Math.round(typography.body * 1.5),
    color: colors.textSecondary,
  },
  button: {
    marginTop: spacing.xs,
  },
});
