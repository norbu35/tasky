import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { elevations } from '@/design/tokenAdapter';
import type { PendingReview } from '@/lib/mobileApiClient';

interface ReviewGateBannerProps {
  pendingReview: PendingReview;
}

export function ReviewGateBanner({ pendingReview }: ReviewGateBannerProps) {
  const { t } = useTranslation();

  const handlePress = () => {
    router.push(`/(shared)/review/${pendingReview.booking_id}`);
  };

  const isHardBlocked =
    Date.now() - new Date(pendingReview.triggered_at).getTime() > 72 * 60 * 60 * 1000;

  return (
    <View
      className="bg-card rounded-md p-xl gap-md mx-xl mb-lg border border-border"
      style={elevations.card}
    >
      <View className="gap-xs">
        <Text className="text-subtitle font-bold text-foreground">
          {isHardBlocked
            ? t('reviewGate.hardLockedTitle', 'Review Required')
            : t('reviewGate.softLockedTitle', 'Pending Review')}
        </Text>
        <Text className="text-body text-text-secondary leading-normal">
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
      />
    </View>
  );
}
