import { Star } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { SearchBar } from '@/components/ui/SearchBar';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { ProfileReputationSummary } from '@/features/profile/components/ProfileReputationSummary';
import { ReviewThresholdSummary } from '@/features/profile/components/ReviewThresholdSummary';
import { formatPublicRating } from '@/features/profile/model';
import type { Review } from '@/lib/api/types';
import { cn } from '@/lib/cn';

const { colors } = mobileTheme;

interface TaskerProfileReviewsSectionProps {
  publicRatingVisible: boolean;
  completedTasks?: number | null;
  rating?: number | null;
  reviews: Review[];
}

export function TaskerProfileReviewsSection({
  publicRatingVisible,
  completedTasks,
  rating,
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
  const reviewCount = reviews.length;

  return (
    <View className="gap-lg">
      {!publicRatingVisible ? (
        <>
          <Text className="text-heading font-sans-bold text-primary-deep">
            {t('customer.taskerProfile.reviews')}
          </Text>
          <ReviewThresholdSummary
            reviewCount={reviewCount}
            testID="tasker-profile-low-review-summary"
          />
        </>
      ) : (
        <>
          <ProfileReputationSummary
            testID="tasker-profile-review-summary"
            title={t('customer.taskerProfile.publicReputation')}
            body={t('customer.taskerProfile.reviewSummaryBody')}
            rating={formatPublicRating(rating)}
            metrics={[
              {
                value: String(completedTasks ?? 0),
                label: t('customer.taskerProfile.completedJobs'),
              },
              {
                value: String(reviewCount),
                label: t('customer.taskerProfile.reviews'),
              },
              {
                value: formatPublicRating(rating),
                label: t('customer.taskerProfile.rating'),
              },
            ]}
          />

          <View className="gap-xs">
            <View className="flex-row items-center justify-between gap-md">
              <Text className="text-heading font-sans-bold text-primary-deep">
                {t('customer.taskerProfile.reviewCount', { count: reviewCount })}
              </Text>
              <Text className="text-caption text-text-secondary">
                {t('customer.taskerProfile.mostRelevant')}
              </Text>
            </View>
            <Text className="text-caption text-text-secondary underline">
              {t('customer.taskerProfile.reviewSystemNote')}
            </Text>
          </View>

          <SearchBar
            testID="tasker-profile-review-search"
            value={reviewQuery}
            onChangeText={setReviewQuery}
            placeholder={t('customer.taskerProfile.reviewSearchPlaceholder')}
            containerClassName="rounded-full border border-border bg-background"
          />
          <View className="flex-row gap-sm">
            <Touchable
              accessibilityRole="button"
              accessibilityState={{ selected: reviewFilter === 'all' }}
              onPress={() => setReviewFilter('all')}
              testID="tasker-profile-review-filter-all"
              className={cn(
                'rounded-full border px-md py-sm',
                reviewFilter === 'all'
                  ? 'bg-foreground border-foreground'
                  : 'bg-background border-border',
              )}
            >
              <Text
                className={cn(
                  'text-label font-sans-bold',
                  reviewFilter === 'all' ? 'text-background' : 'text-foreground',
                )}
              >
                {t('customer.taskerProfile.filterAll')}
              </Text>
            </Touchable>
            <Touchable
              accessibilityRole="button"
              accessibilityState={{ selected: reviewFilter === 'five-star' }}
              onPress={() => setReviewFilter('five-star')}
              testID="tasker-profile-review-filter-five-star"
              className={cn(
                'rounded-full border px-md py-sm',
                reviewFilter === 'five-star'
                  ? 'bg-foreground border-foreground'
                  : 'bg-background border-border',
              )}
            >
              <Text
                className={cn(
                  'text-label font-sans-bold',
                  reviewFilter === 'five-star' ? 'text-background' : 'text-foreground',
                )}
              >
                {t('customer.taskerProfile.filterFiveStar')}
              </Text>
            </Touchable>
          </View>
        </>
      )}

      {publicRatingVisible && filteredReviews.length === 0 ? (
        <View
          testID={
            reviewQuery.trim() ? 'tasker-profile-review-no-results' : 'tasker-profile-review-empty'
          }
          className="border-t border-border pt-xl gap-sm"
        >
          <Text className="text-subtitle font-sans-bold text-foreground">
            {reviewQuery.trim()
              ? t('customer.taskerProfile.noReviewResults')
              : t('customer.taskerProfile.noReviews')}
          </Text>
          <Text className="text-body text-text-secondary leading-[24px]">
            {reviewQuery.trim()
              ? t('customer.taskerProfile.noReviewResultsBody')
              : t('customer.taskerProfile.noReviewsBody')}
          </Text>
        </View>
      ) : publicRatingVisible ? (
        <View>
          {filteredReviews.map((review, index) => (
            <View
              key={review.id}
              className={cn('gap-sm py-lg', index > 0 && 'border-t border-border')}
            >
              <View className="flex-row items-start gap-md">
                <View className="h-[44px] w-[44px] rounded-full bg-muted items-center justify-center">
                  <Text className="text-label font-sans-bold text-foreground">
                    {(review.reviewer?.full_name ?? '?').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1 gap-xs">
                  <Text className="text-label font-sans-bold text-foreground">
                    {review.reviewer?.full_name ?? ''}
                  </Text>
                  <View className="flex-row items-center gap-xs">
                    <Star size={16} color={colors.accent} fill={colors.accent} />
                    <Text className="text-label font-sans-bold text-foreground">
                      {review.quality_rating}
                    </Text>
                    <Text className="text-caption text-text-secondary">
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
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
