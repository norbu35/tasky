import { Star } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';

interface ReputationMetric {
  label: string;
  value: string;
}

interface ProfileReputationSummaryProps {
  title: string;
  body: string;
  rating: string;
  metrics: ReputationMetric[];
  testID?: string;
}

const { colors } = mobileTheme;

export function ProfileReputationSummary({
  title,
  body,
  rating,
  metrics,
  testID,
}: ProfileReputationSummaryProps) {
  return (
    <View testID={testID} className="rounded-md border border-border bg-card p-lg gap-lg">
      <View className="items-center gap-xs">
        <View className="flex-row items-center gap-sm">
          <Star size={22} color={colors.accent} fill={colors.accent} />
          <Text className="text-heroTitle font-sans-bold text-foreground">{rating}</Text>
        </View>
        <Text className="text-subtitle font-sans-bold text-primary-deep text-center">{title}</Text>
        <Text className="text-caption text-text-secondary text-center leading-[20px]">{body}</Text>
      </View>

      <View className="flex-row border-t border-border pt-md">
        {metrics.map((metric, index) => (
          <View
            key={`${metric.label}-${metric.value}`}
            className="flex-1 items-center px-sm"
            style={index > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.border } : undefined}
          >
            <Text className="text-title font-sans-bold text-foreground">{metric.value}</Text>
            <Text className="text-caption text-text-secondary text-center">{metric.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
