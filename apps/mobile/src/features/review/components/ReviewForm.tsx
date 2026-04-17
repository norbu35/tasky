import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, CheckCircle, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { InsetScrollView, ScreenContainer, StickyActionBar } from '@/components/shells';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme, withAlpha } from '@/design/tokenAdapter';

import { useSubmitReview } from '../hooks/useSubmitReview';

const { colors, radius, spacing, typography } = mobileTheme;

const STAR_COUNT = 5;
const COMMENT_MAX_LENGTH = 500;
const STAR_SIZE = typography.body + spacing.lg / 2;

interface CategoryRating {
  key: string;
  labelKey: string;
  value: number;
}

type ReviewRole = 'customer' | 'tasker';

type ReviewParams = {
  bookingId?: string;
  role?: ReviewRole;
  name?: string;
  avatarUrl?: string;
};

const CUSTOMER_CATEGORIES: CategoryRating[] = [
  { key: 'qualityOfWork', labelKey: 'shared.review.qualityOfWork', value: 0 },
  { key: 'punctuality', labelKey: 'shared.review.punctuality', value: 0 },
  { key: 'communication', labelKey: 'shared.review.communication', value: 0 },
];

const TASKER_CATEGORIES: CategoryRating[] = [
  { key: 'taskDescriptionClarity', labelKey: 'shared.review.taskClarity', value: 0 },
  { key: 'respectfulness', labelKey: 'shared.review.respectfulness', value: 0 },
  { key: 'punctuality', labelKey: 'shared.review.punctuality', value: 0 },
];

function getCategoryLabel(role: ReviewRole, categoryKey: string, t: (key: string) => string) {
  if (role === 'tasker') {
    if (categoryKey === 'taskDescriptionClarity') return t('ReviewFormScreen.copy1');
    if (categoryKey === 'respectfulness') return t('ReviewFormScreen.copy2');
    if (categoryKey === 'punctuality') return t('ReviewFormScreen.copy3');
    return t('ReviewFormScreen.copy4');
  }

  if (categoryKey === 'qualityOfWork') return t('ReviewFormScreen.copy5');
  if (categoryKey === 'punctuality') return t('ReviewFormScreen.copy6');
  if (categoryKey === 'communication') return t('ReviewFormScreen.copy7');
  return t('ReviewFormScreen.copy8');
}

function createCategories(role: ReviewRole) {
  const base = role === 'tasker' ? TASKER_CATEGORIES : CUSTOMER_CATEGORIES;
  return base.map((category) => ({ ...category }));
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

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
    <View className="flex-row items-center gap-md">
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const starIndex = i + 1;
        const isActive = starIndex <= value;
        return (
          <Touchable
            key={starIndex}
            testID={`rating-${categoryKey}-star-${starIndex}`}
            onPress={() => onChange(starIndex)}
            className="p-[2px]"
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
          >
            <Star
              size={STAR_SIZE}
              color={isActive ? colors.secondary : colors.chipInactive}
              fill={isActive ? colors.secondary : 'none'}
            />
          </Touchable>
        );
      })}
    </View>
  );
}

export default function ReviewFormScreen() {
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
        <View
          className="flex-row items-center gap-md px-screen-x py-lg bg-background"
          testID="review-form-header"
        >
          <Touchable
            testID="review-form-close"
            onPress={handleClose}
            className="w-12 h-12 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <ArrowLeft size={22} color={colors.primaryDeep} />
          </Touchable>
          <Text
            className="flex-1 text-title font-sans-bold text-primary-deep"
            style={{ lineHeight: Math.round(typography.title * 1.4), letterSpacing: -0.5 }}
          >
            {t('shared.review.navTitle')}
          </Text>
        </View>

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
              <Animated.View
                style={{ transform: [{ scale: successScale }] }}
                className="items-center justify-center py-[48px] gap-md"
                testID="review-success-state"
              >
                <View
                  className="w-20 h-20 rounded-full items-center justify-center bg-muted"
                  style={{ borderRadius: radius.full }}
                >
                  <CheckCircle size={34} color={colors.primary} fill={colors.verified} />
                </View>
                <Text className="text-title font-sans-bold text-primary-deep">
                  {t('shared.review.successTitle')}
                </Text>
                <Text
                  className="max-w-[320px] text-center text-body text-text-secondary"
                  style={{ lineHeight: Math.round(typography.body * 1.6) }}
                >
                  {t('shared.review.successBody')}
                </Text>
              </Animated.View>
            ) : (
              <>
                <View className="flex-row items-center gap-xl">
                  <ProfileAvatar
                    uri={avatarUrl}
                    name={counterpartyName}
                    size="lg"
                    showVerified={true}
                  />
                  <View className="flex-1 gap-xs">
                    <Text className="text-subtitle font-sans-bold text-primary-deep">
                      {counterpartyName}
                    </Text>
                    <Text
                      className="self-start rounded-full px-md py-[2px] text-caption font-sans-bold text-text-secondary"
                      style={{ backgroundColor: colors.statusOpen }}
                    >
                      {counterpartyRole}
                    </Text>
                  </View>
                </View>

                <View className="rounded-md bg-muted p-xl gap-[20px]">
                  {categories.map((category) => (
                    <View key={category.key} className="gap-md">
                      <View className="flex-row items-center justify-between gap-lg">
                        <Text
                          className="flex-1 text-body font-sans-semibold text-primary-deep"
                          style={{ lineHeight: Math.round(typography.body * 1.6) }}
                        >
                          {getCategoryLabel(role, category.key, t)}
                        </Text>
                        <Text className="text-label font-sans-bold text-secondary">
                          {category.value > 0
                            ? category.value.toFixed(1)
                            : t('ReviewFormScreen.copy13')}
                        </Text>
                      </View>
                      <StarRatingInput
                        categoryKey={category.key}
                        value={category.value}
                        onChange={(rating) => handleRatingChange(category.key, rating)}
                      />
                    </View>
                  ))}
                </View>

                <FormField label={t('shared.review.label_comment')}>
                  <View className="relative rounded-md bg-muted p-xl pb-[32px] min-h-[168px]">
                    <Input
                      testID="review-comment-input"
                      multiline
                      textAlignVertical="top"
                      value={comment}
                      onChangeText={setComment}
                      maxLength={COMMENT_MAX_LENGTH}
                      placeholder={t('ReviewFormScreen.copy1')}
                      className="min-h-[100px] border-0 bg-transparent px-0 py-0 text-body font-sans text-primary-deep"
                    />
                    <Text
                      className="absolute right-lg bottom-md text-micro font-sans-bold text-text-secondary"
                      style={{ letterSpacing: 1 }}
                    >{`${comment.length} / ${COMMENT_MAX_LENGTH}`}</Text>
                  </View>
                </FormField>
              </>
            )}
          </InsetScrollView>
        </KeyboardAvoidingView>

        {!showSuccess ? (
          <StickyActionBar testID="review-form-footer">
            {errorMessage ? (
              <View
                testID="review-submit-error"
                className="mb-sm rounded-md bg-card p-lg gap-sm"
                style={elevations.card}
              >
                <Text
                  className="text-body text-danger"
                  style={{ lineHeight: Math.round(typography.body * 1.5) }}
                >
                  {errorMessage}
                </Text>
                <Button
                  label={t('common.retry')}
                  variant="ghost"
                  onPress={handleSubmit}
                  style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
                  testID="review-submit-retry"
                />
              </View>
            ) : null}

            <View onLayout={handleActionBarLayout}>
              <BlurView
                intensity={80}
                tint="light"
                style={{
                  borderRadius: radius.lg,
                  overflow: 'hidden',
                  backgroundColor: withAlpha(colors.card, 0.8),
                  ...elevations.navBar,
                }}
              >
                <View className="pt-action-bar">
                  <Button
                    testID="review-form-next"
                    onPress={handleSubmit}
                    disabled={!allRated}
                    isLoading={submitReview.isPending}
                    style={{ alignSelf: 'stretch', justifyContent: 'center' }}
                  >
                    <View className="flex-row items-center justify-center gap-sm">
                      <Text className="text-body font-sans-bold text-primary-foreground">
                        {submitLabel}
                      </Text>
                      <ArrowRight size={16} color={colors.primaryForeground} />
                    </View>
                  </Button>
                </View>
              </BlurView>
            </View>
          </StickyActionBar>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
