import React from 'react';
import { Text, View } from 'react-native';

import { cn } from '../../lib/cn';

interface StatCardProps {
  value: string;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <View className={cn('flex-1 bg-muted rounded-md p-4 items-center justify-center', className)}>
      <Text className="text-2xl font-sans-bold text-foreground text-center">{value}</Text>
      <Text className="text-micro font-sans-bold text-muted-foreground uppercase tracking-wide mt-xs text-center">
        {label}
      </Text>
    </View>
  );
}
