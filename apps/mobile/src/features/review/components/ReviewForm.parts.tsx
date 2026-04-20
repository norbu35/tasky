import { BlurView } from 'expo-blur';
import { ArrowLeft, ArrowRight, CheckCircle, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';

import {
  type CategoryRating,
  type ReviewRole,
  COMMENT_MAX_LENGTH,
  STAR_COUNT,
  STAR_SIZE,
  colors,
  getCategoryLabel,
  radius,
  typography,
  withAlpha,
} from './ReviewForm.model';

export function StarRatingInput({
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
              color={isActive ? colors.sunLight : colors.chipInactive}
              fill={isActive ? colors.sunLight : 'none'}
            />
          </Touchable>
        );
      })}
    </View>
  );
}

export function ReviewFormHeader({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <View
      className="flex-row items-center gap-md px-screen-x py-lg bg-background"
      testID="review-form-header"
    >
      <Touchable
        testID="review-form-close"
        onPress={onClose}
        className="w-12 h-12 rounded-full items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
      >
        <ArrowLeft size={20} color={colors.primaryDeep} />
      </Touchable>
      <Text
        className="flex-1 text-title font-sans-bold text-primary-deep"
        style={{ lineHeight: Math.round(typography.title * 1.4), letterSpacing: -0.5 }}
      >
        {t('shared.review.navTitle')}
      </Text>
    </View>
  );
}

export function CounterpartyCard({
  name,
  role,
  avatarUrl,
}: {
  name: string;
  role: string;
  avatarUrl: string;
}) {
  return (
    <View className="flex-row items-center gap-xl">
      <ProfileAvatar uri={avatarUrl} name={name} size="lg" showVerified={true} />
      <View className="flex-1 gap-xs">
        <Text className="text-subtitle font-sans-bold text-primary-deep">{name}</Text>
        <Text
          className="self-start rounded-full px-md py-[2px] text-caption font-sans-bold text-text-secondary"
          style={{ backgroundColor: colors.statusOpen }}
        >
          {role}
        </Text>
      </View>
    </View>
  );
}

export function RatingSection({
  categories,
  role,
  onRatingChange,
}: {
  categories: CategoryRating[];
  role: ReviewRole;
  onRatingChange: (key: string, rating: number) => void;
}) {
  const { t } = useTranslation();

  return (
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
              {category.value > 0 ? category.value.toFixed(1) : t('ReviewFormScreen.copy13')}
            </Text>
          </View>
          <StarRatingInput
            categoryKey={category.key}
            value={category.value}
            onChange={(rating) => onRatingChange(category.key, rating)}
          />
        </View>
      ))}
    </View>
  );
}

export function CommentField({
  comment,
  onChangeComment,
}: {
  comment: string;
  onChangeComment: (text: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <FormField label={t('shared.review.label_comment')}>
      <View className="relative rounded-md bg-muted p-xl pb-[32px] min-h-[168px]">
        <Input
          testID="review-comment-input"
          multiline
          textAlignVertical="top"
          value={comment}
          onChangeText={onChangeComment}
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
  );
}

export function SuccessOverlay({ scale }: { scale: Animated.Value }) {
  const { t } = useTranslation();

  return (
    <Animated.View
      style={{ transform: [{ scale }] }}
      className="items-center justify-center py-[48px] gap-md"
      testID="review-success-state"
    >
      <View
        className="w-20 h-20 rounded-full items-center justify-center bg-muted"
        style={{ borderRadius: radius.full }}
      >
        <CheckCircle size={24} color={colors.primary} fill={colors.verified} />
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
  );
}

export function SubmitFooter({
  allRated,
  errorMessage,
  isPending,
  submitLabel,
  onSubmit,
  onLayout,
}: {
  allRated: boolean;
  errorMessage: string | null;
  isPending: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onLayout: (event: import('react-native').LayoutChangeEvent) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
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
            onPress={onSubmit}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
            testID="review-submit-retry"
          />
        </View>
      ) : null}

      <View onLayout={onLayout}>
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
              onPress={onSubmit}
              disabled={!allRated}
              isLoading={isPending}
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
    </>
  );
}
