import React from 'react';
import { Text } from 'react-native';

import { cn } from '@/lib/cn';
import { resolveLocale } from '@/utils/formatDate';
import i18n from 'i18next';

type PriceSize = 'sm' | 'md' | 'lg';

interface PriceTagProps {
  amount: number | null;
  size?: PriceSize;
  testID?: string;
  className?: string;
}

const fontSizeClassMap: Record<PriceSize, string> = {
  sm: 'text-label',
  md: 'text-subtitle',
  lg: 'text-heading',
};

function formatAmount(amount: number): string {
  return amount.toLocaleString(resolveLocale(i18n.language));
}

export function PriceTag({ amount, size = 'md', testID, className }: PriceTagProps) {
  if (amount == null) {
    return null;
  }
  return (
    <Text
      className={cn('text-sun-light font-display-bold', fontSizeClassMap[size], className)}
      testID={testID}
      accessibilityLabel={`${formatAmount(amount)} tugrik`}
    >
      {'₮'}
      {formatAmount(amount)}
    </Text>
  );
}
