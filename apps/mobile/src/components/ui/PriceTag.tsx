import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, typography } = mobileTheme;

type PriceSize = 'sm' | 'md' | 'lg';

interface PriceTagProps {
  amount: number;
  size?: PriceSize;
  testID?: string;
}

const fontSizeMap: Record<PriceSize, number> = {
  sm: typography.label,
  md: typography.subtitle,
  lg: typography.heading,
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US');
}

export function PriceTag({ amount, size = 'md', testID }: PriceTagProps) {
  return (
    <Text
      style={[styles.price, { fontSize: fontSizeMap[size] }]}
      testID={testID}
      accessibilityLabel={`${formatAmount(amount)} tugrik`}
    >
      {'\u20AE'}
      {formatAmount(amount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  price: {
    color: colors.secondary,
    fontWeight: '700',
  },
});
