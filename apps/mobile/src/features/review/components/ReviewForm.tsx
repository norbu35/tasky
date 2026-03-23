import React, { useState, useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';
import { FormWizardTemplate } from '../../../components/templates/FormWizardTemplate';
import { useSubmitReview } from '../hooks/useSubmitReview';

const { colors, radius, spacing, typography } = mobileTheme;

const STAR_COLOR_ACTIVE = colors.accent;
const STAR_COUNT = 5;
const COMMENT_MAX_LENGTH = 1000;

interface CategoryRating {
  key: string;
  labelKey: string;
  value: number;
}

export interface ReviewPayload {
  bookingId: string;
  ratings: Record<string, number>;
  comment: string;
}

/** Categories a customer rates about a tasker */
const RATE_TASKER_CATEGORIES: CategoryRating[] = [
  { key: 'qualityOfWork', labelKey: 'shared.review.qualityOfWork', value: 0 },
  { key: 'punctuality', labelKey: 'shared.review.punctuality', value: 0 },
  { key: 'communication', labelKey: 'shared.review.communication', value: 0 },
];

/** Categories a tasker rates about a customer */
const RATE_CUSTOMER_CATEGORIES: CategoryRating[] = [
  { key: 'taskDescriptionClarity', labelKey: 'shared.review.taskClarity', value: 0 },
  { key: 'respectfulness', labelKey: 'shared.review.respectfulness', value: 0 },
  { key: 'punctuality', labelKey: 'shared.review.punctuality', value: 0 },
];

function StarRatingInput({
  categoryKey,
  value,
  onChange,
}: {
  categoryKey: string;
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const starIndex = i + 1;
        const isActive = starIndex <= value;
        return (
          <Pressable
            key={starIndex}
            testID={`rating-${categoryKey}-star-${starIndex}`}
            onPress={() => onChange(starIndex)}
            hitSlop={6}
            style={styles.starHit}
          >
            <Star
              size={28}
              color={isActive ? STAR_COLOR_ACTIVE : colors.chipInactive}
              fill={isActive ? STAR_COLOR_ACTIVE : 'none'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Full-screen Review Form component (SCR-SHARED-017).
 * Uses FormWizardTemplate with useSubmitReview hook.
 *
 * `role` param indicates the current user role:
 *  - customer -> rates the tasker (quality, punctuality, communication)
 *  - tasker   -> rates the customer (clarity, respectfulness, punctuality)
 */
export default function ReviewFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId = '', role = 'customer' } = useLocalSearchParams<{
    bookingId: string;
    role: string;
  }>();

  const handleSuccess = useCallback(() => {
    Alert.alert(
      t('shared.review.successTitle', 'Thank you!'),
      t('shared.review.successBody', 'Your review has been submitted.'),
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }, [t, router]);

  const submitReview = useSubmitReview(handleSuccess);

  // Customer reviews the tasker; tasker reviews the customer
  const initialCategories = role === 'customer' ? RATE_TASKER_CATEGORIES : RATE_CUSTOMER_CATEGORIES;

  const [categories, setCategories] = useState<CategoryRating[]>(() =>
    initialCategories.map((c) => ({ ...c })),
  );
  const [comment, setComment] = useState('');

  const allRated = categories.every((c) => c.value > 0);

  const handleRatingChange = useCallback((key: string, rating: number) => {
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, value: rating } : c)));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!allRated) return;

    const ratings: Record<string, number> = {};
    for (const c of categories) {
      ratings[c.key] = c.value;
    }

    submitReview.mutate({
      bookingId,
      ratings,
      comment: comment.trim(),
    });
  }, [allRated, categories, comment, bookingId, submitReview]);

  return (
    <FormWizardTemplate
      testID="review-form"
      currentStep={0}
      totalSteps={1}
      onNext={handleSubmit}
      nextLabel={t('shared.review.submit')}
      nextDisabled={!allRated}
      nextLoading={submitReview.isPending}
      showBack={false}
    >
      <Text style={styles.title}>{t('shared.review.title')}</Text>

      {/* Category ratings */}
      <View style={styles.categoriesCard}>
        {categories.map((category) => (
          <View key={category.key} style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>{t(category.labelKey)}</Text>
            <StarRatingInput
              categoryKey={category.key}
              value={category.value}
              onChange={(rating) => handleRatingChange(category.key, rating)}
            />
          </View>
        ))}
      </View>

      {/* Comment */}
      <View style={styles.commentCard}>
        <TextInput
          testID="review-comment-input"
          style={styles.commentInput}
          placeholder={t('shared.review.commentPlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
          maxLength={COMMENT_MAX_LENGTH}
        />
      </View>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  categoriesCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    ...elevations.card,
  },
  categoryRow: {
    gap: spacing.xs,
  },
  categoryLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.foreground,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  starHit: {
    padding: 2,
  },
  commentCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...elevations.card,
  },
  commentInput: {
    minHeight: 100,
    padding: spacing.lg,
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: 22,
  },
});
