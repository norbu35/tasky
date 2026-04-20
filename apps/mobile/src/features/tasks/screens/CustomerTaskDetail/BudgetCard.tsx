import React from 'react';
import { Text, View } from 'react-native';

import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

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
    <View className="bg-primary-deep rounded-lg p-lg gap-sm" style={elevations.soft}>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-caption font-bold uppercase"
          style={{
            letterSpacing: taskDetail.sectionTracking,
            color: tint.primaryForegroundMuted,
          }}
        >
          {t('TaskDetailCustomerScreen.budgetLabel')}
        </Text>
        <View
          className="px-sm py-xs rounded-full"
          style={{ backgroundColor: tint.primaryForegroundSoft }}
        >
          <Text className="text-micro font-bold text-primary-foreground">
            {applicantCount} {t('TaskDetailCustomerScreen.applicants')}
          </Text>
        </View>
      </View>
      <Text
        className="text-secondary font-extrabold"
        style={{ fontSize: typography.heroTitle, lineHeight: taskDetail.budgetLineHeight }}
      >
        {formatBudget(budget)}
      </Text>
    </View>
  );
}
