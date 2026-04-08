import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

type StatusType = 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show';

const badgeVariants = cva('self-start px-md py-xs rounded-full', {
  variants: {
    status: {
      open: 'bg-statusOpen',
      assigned: 'bg-statusAssigned',
      completed: 'bg-verified',
      cancelled: 'bg-muted',
      no_show: 'bg-danger',
    },
  },
});

const textVariants = cva('text-micro font-sans-bold uppercase tracking-widest', {
  variants: {
    status: {
      open: 'text-statusOpenForeground',
      assigned: 'text-statusAssignedForeground',
      completed: 'text-verifiedForeground',
      cancelled: 'text-muted-foreground',
      no_show: 'text-danger-foreground',
    },
  },
});

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  testID?: string;
}

export function StatusBadge({ status, className, testID }: StatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <View className={cn(badgeVariants({ status }), className)} testID={testID}>
      <Text className={textVariants({ status })}>{t(`status.${status}`)}</Text>
    </View>
  );
}
