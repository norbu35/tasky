import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { InsetScrollView, ScreenContainer, StickyActionBar } from '@/components/shells';
import { screenLayout } from '@/design/screenLayout';

import { useSubmitReview } from '../hooks/useSubmitReview';

import {
  type CategoryRating,
  type ReviewParams,
  type ReviewRole,
  createCategories,
  getMutationErrorMessage,
  spacing,
} from './ReviewForm.model';
import { CommentField } from './ReviewForm.CommentField';
import { CounterpartyCard, ReviewFormHeader } from './ReviewForm.Header';
import { RatingSection } from './ReviewForm.RatingInput';
import { SubmitFooter, SuccessOverlay } from './ReviewForm.SubmitSection';

export default function ReviewForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<ReviewParams>();

  const bookingId = params.bookingId ?? '';
  const role: ReviewRole = params.role === 'tasker' ? 'tasker' : 'customer';

  const [showSuccess, setShowSuccess] = useState(false);
  const [actionBarHeight, setActionBarHeight] = useState(112);
  const successScale = useMemo(() => new Animated.Value(0.88), []);

  const [categories, setCategories] = useState<CategoryRating[]>(() => createCategories(role));
  const [comment, setComment] = useState('');
  const submitReview = useSubmitReview(() => {
    setShowSuccess(true);
  });

  const counterpartyName =
    params.name ??
    (role === 'customer' ? t('ReviewFormScreen.copy9') : t('ReviewFormScreen.copy10'));
  const counterpartyRole =
    role === 'customer' ? t('ReviewFormScreen.copy11') : t('ReviewFormScreen.copy12');
  const avatarUrl = params.avatarUrl ?? 'https://cdn.tasky.mn/avatars/counterparty.jpg';

  const allRated = categories.every((category) => category.value > 0);
  const submitLabel = t('shared.review.cta_submit');

  useEffect(() => {
    if (!showSuccess) return undefined;

    Animated.spring(successScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 70,
    }).start();

    const timeout = setTimeout(() => {
      router.back();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [router, showSuccess, successScale]);

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
  }, [allRated, bookingId, categories, comment, submitReview]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleActionBarLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      setActionBarHeight(height);
    }
  }, []);

  const errorMessage = submitReview.isError
    ? getMutationErrorMessage(submitReview.error, t('ReviewFormScreen.copy2'))
    : null;

  return (
    <ScreenContainer testID="SCR-SHARED-017" padded={false}>
      <View className="flex-1 bg-background">
        <ReviewFormHeader onClose={handleClose} />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <InsetScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: screenLayout.insetX,
              paddingTop: spacing['2xl'],
              gap: spacing['3xl'],
            }}
            extraBottomInset={showSuccess ? 0 : actionBarHeight}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showSuccess ? (
              <SuccessOverlay scale={successScale} />
            ) : (
              <>
                <CounterpartyCard
                  name={counterpartyName}
                  role={counterpartyRole}
                  avatarUrl={avatarUrl}
                />
                <RatingSection
                  categories={categories}
                  role={role}
                  onRatingChange={handleRatingChange}
                />
                <CommentField comment={comment} onChangeComment={setComment} />
              </>
            )}
          </InsetScrollView>
        </KeyboardAvoidingView>

        {!showSuccess ? (
          <StickyActionBar testID="review-form-footer">
            <SubmitFooter
              allRated={allRated}
              errorMessage={errorMessage}
              isPending={submitReview.isPending}
              submitLabel={submitLabel}
              onSubmit={handleSubmit}
              onLayout={handleActionBarLayout}
            />
          </StickyActionBar>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
