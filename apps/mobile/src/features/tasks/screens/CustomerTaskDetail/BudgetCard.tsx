import React from 'react';
import { Text, View } from 'react-native';

import { elevations } from '@/design/elevations';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';

import { formatBudget } from './model';

const { typography } = mobileTheme;
const { taskDetail, tint } = mobileSurfaces;

interface BudgetCardProps {
  budget?: number | null;
  applicantCount: number;
  t: (k: string) => string;
}

export function BudgetCard({ budget, applicantCount, t }: BudgetCardProps) {
  return (
    <View className="flex-row gap-sm">
      {/* Budget stat card */}
      <View className="flex-1 bg-primary-deep rounded-2xl p-lg gap-xs" style={elevations.soft}>
        <Text
          className="text-caption font-bold uppercase"
          style={{
            letterSpacing: taskDetail.sectionTracking,
            color: tint.primaryForegroundMuted,
          }}
        >
          {t('TaskDetailCustomerScreen.budgetLabel')}
        </Text>
        <Text
          className="text-secondary font-extrabold"
          style={{ fontSize: typography.heroTitle, lineHeight: taskDetail.budgetLineHeight }}
        >
          {formatBudget(budget)}
        </Text>
      </View>

      {/* Applicants stat card */}
      <View className="flex-1 bg-muted rounded-2xl p-lg gap-xs justify-between">
        <Text
          className="text-caption font-bold uppercase text-text-secondary"
          style={{ letterSpacing: taskDetail.sectionTracking }}
        >
          {t('TaskDetailCustomerScreen.applicants')}
        </Text>
        <Text
          className="text-primary-deep font-extrabold"
          style={{ fontSize: typography.heroTitle, lineHeight: taskDetail.budgetLineHeight }}
        >
          {applicantCount}
        </Text>
      </View>
    </View>
  );
}
