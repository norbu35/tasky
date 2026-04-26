import { Star } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { SearchBar } from '@/components/ui/SearchBar';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { ReviewThresholdSummary } from '@/features/profile/components/ReviewThresholdSummary';
import type { Review } from '@/lib/api/types';

const { colors } = mobileTheme;

interface TaskerProfileReviewsSectionProps {
  publicRatingVisible: boolean;
  completedTasks?: number | null;
  reviews: Review[];
}

export function TaskerProfileReviewsSection({
  publicRatingVisible,
  completedTasks,
  reviews,
}: TaskerProfileReviewsSectionProps) {
  const { t } = useTranslation();
  const [reviewQuery, setReviewQuery] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'five-star'>('all');
  const filteredReviews = useMemo(() => {
    const normalizedQuery = reviewQuery.trim().toLowerCase();
    return reviews.filter((review) => {
      const matchesRating = reviewFilter === 'all' || Math.round(review.quality_rating ?? 0) === 5;
      const searchableText = `${review.reviewer?.full_name ?? ''} ${review.comment ?? ''}`
        .toLowerCase()
        .trim();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      return matchesRating && matchesQuery;
    });
  }, [reviews, reviewFilter, reviewQuery]);

  return (
    <View className="gap-md">
      <Text className="text-heading font-sans-bold text-primary-deep">
        {t('customer.taskerProfile.reviews')}
      </Text>

      {!publicRatingVisible ? (
        <ReviewThresholdSummary completedTasks={completedTasks} />
      ) : (
        <>
          <SearchBar
            value={reviewQuery}
            onChangeText={setReviewQuery}
            placeholder={t('customer.taskerProfile.reviewSearchPlaceholder')}
          />
          <View className="flex-row gap-sm">
            <Touchable
              accessibilityRole="button"
              accessibilityState={{ selected: reviewFilter === 'all' }}
              onPress={() => setReviewFilter('all')}
              testID="tasker-profile-review-filter-all"
              className="rounded-full px-md py-sm bg-muted"
            >
              <Text className="text-label font-sans-bold text-foreground">
                {t('customer.taskerProfile.filterAll')}
              </Text>
            </Touchable>
            <Touchable
              accessibilityRole="button"
              accessibilityState={{ selected: reviewFilter === 'five-star' }}
              onPress={() => setReviewFilter('five-star')}
              testID="tasker-profile-review-filter-five-star"
              className="rounded-full px-md py-sm bg-muted"
            >
              <Text className="text-label font-sans-bold text-foreground">
                {t('customer.taskerProfile.filterFiveStar')}
              </Text>
            </Touchable>
          </View>
        </>
      )}

      {publicRatingVisible && filteredReviews.length === 0 ? (
        <Text className="text-body text-text-secondary text-center py-xl">
          {t('customer.taskerProfile.noReviews')}
        </Text>
      ) : publicRatingVisible ? (
        <View className="gap-md">
          {filteredReviews.map((review) => (
            <View key={review.id} className="bg-muted rounded-lg p-lg gap-sm">
              <View className="flex-row justify-between items-center">
                <Text className="text-label font-sans-bold text-foreground">
                  {review.reviewer?.full_name ?? ''}
                </Text>
                <View className="flex-row items-center gap-xs">
                  <Star size={16} color={colors.accent} fill={colors.accent} />
                  <Text className="text-label font-sans-bold text-foreground">
                    {review.quality_rating}
                  </Text>
                </View>
              </View>
              {review.comment ? (
                <Text className="text-body text-muted-foreground leading-[24px]">
                  {review.comment}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
