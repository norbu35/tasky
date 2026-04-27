import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';

import { getReviewThresholdRemaining, MIN_PUBLIC_REVIEW_COUNT } from '../model';

interface ReviewThresholdSummaryProps {
  reviewCount?: number | null;
  className?: string;
  testID?: string;
}

export function ReviewThresholdSummary({
  reviewCount,
  className,
  testID,
}: ReviewThresholdSummaryProps) {
  const { t } = useTranslation();
  const remaining = getReviewThresholdRemaining(reviewCount);

  return (
    <View
      testID={testID}
      className={className ?? 'rounded-md p-md gap-xs'}
      style={{ backgroundColor: mobileSurfaces.tint.trustSoft }}
    >
      <Text className="text-label font-sans-bold text-primary-deep">
        {t('shared.profile.lowReviewTitle')}
      </Text>
      <Text className="text-caption text-text-secondary leading-[20px]">
        {t('shared.profile.lowReviewBody', {
          count: MIN_PUBLIC_REVIEW_COUNT,
          remaining,
        })}
      </Text>
      <View
        className="h-[3px] rounded-full mt-xs"
        style={{ backgroundColor: mobileTheme.colors.trustMuted, opacity: 0.3 }}
      />
    </View>
  );
}
