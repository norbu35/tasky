import { Star } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors } = mobileTheme;

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  testID?: string;
  className?: string;
}

export function RatingStars({
  value,
  onChange,
  readonly = false,
  size = 20,
  testID,
  className,
}: RatingStarsProps) {
  return (
    <View
      className={cn('flex-row items-center gap-xs', className)}
      testID={testID}
      accessibilityLabel={`Rating: ${value} out of 5 stars`}
      accessibilityRole="adjustable"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= value;
        const starElement = (
          <Star
            key={star}
            size={size}
            color={isFilled ? colors.secondary : colors.chipInactive}
            fill={isFilled ? colors.secondary : 'transparent'}
          />
        );

        if (readonly) {
          return <View key={star}>{starElement}</View>;
        }

        return (
          <Pressable
            key={star}
            onPress={() => onChange?.(star)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
          >
            {starElement}
          </Pressable>
        );
      })}
    </View>
  );
}
