import { Star } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors } = mobileTheme;

interface ReviewCardProps {
  reviewerInitials: string;
  reviewerName: string;
  rating: number;
  comment: string;
  timeAgo: string;
  featured?: boolean;
  className?: string;
}

export function ReviewCard({
  reviewerInitials,
  reviewerName,
  rating,
  comment,
  timeAgo,
  featured = false,
  className,
}: ReviewCardProps) {
  return (
    <View
      className={cn(
        'bg-muted rounded-md p-[20px] gap-[11px]',
        featured && 'border-l-4 border-l-primary-deep pl-[24px]',
        className,
      )}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-[12px]">
          <View className="w-[32px] h-[32px] rounded-full bg-muted items-center justify-center">
            <Text className="text-caption font-sans-bold text-text-secondary">
              {reviewerInitials}
            </Text>
          </View>
          <Text className="text-body font-sans-bold text-foreground">{reviewerName}</Text>
        </View>
        <View className="flex-row gap-[1px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={16}
              color={i < rating ? colors.accent : colors.chipInactive}
              fill={i < rating ? colors.accent : 'none'}
            />
          ))}
        </View>
      </View>
      <Text className="text-label text-muted-foreground leading-[19px] italic">{comment}</Text>
      <Text className="text-micro font-sans-semibold text-text-tertiary uppercase tracking-[0.075em]">
        {timeAgo}
      </Text>
    </View>
  );
}
