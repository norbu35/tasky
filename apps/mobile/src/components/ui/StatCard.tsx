import React from 'react';
import { Text, View } from 'react-native';

import { elevations } from '../../design/elevations';
import { cn } from '../../lib/cn';

interface StatCardProps {
  value: string;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <View
      className={cn('flex-1 bg-card rounded-md p-4 items-center justify-center', className)}
      style={elevations.card}
    >
      <Text className="text-[20px] font-display-bold text-primary-deep text-center">{value}</Text>
      <Text className="text-[11px] font-sans-medium text-text-tertiary uppercase tracking-[0.075em] mt-xs text-center">
        {label}
      </Text>
    </View>
  );
}
