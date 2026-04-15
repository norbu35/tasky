import React from 'react';
import { Text } from 'react-native';

import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { typography } = mobileTheme;

type PriceSize = 'sm' | 'md' | 'lg';

interface PriceTagProps {
  amount: number;
  size?: PriceSize;
  testID?: string;
  className?: string;
}

const fontSizeMap: Record<PriceSize, number> = {
  sm: typography.label,
  md: typography.subtitle,
  lg: typography.heading,
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US');
}

export function PriceTag({ amount, size = 'md', testID, className }: PriceTagProps) {
  return (
    <Text
      style={{ fontSize: fontSizeMap[size] }}
      className={cn('text-secondary font-sans-bold', className)}
      testID={testID}
      accessibilityLabel={`${formatAmount(amount)} tugrik`}
    >
      {'\u20AE'}
      {formatAmount(amount)}
    </Text>
  );
}
