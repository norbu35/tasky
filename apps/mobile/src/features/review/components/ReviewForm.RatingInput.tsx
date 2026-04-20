import { Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';

import {
  type CategoryRating,
  type ReviewRole,
  STAR_COUNT,
  STAR_SIZE,
  colors,
  getCategoryLabel,
  typography,
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
