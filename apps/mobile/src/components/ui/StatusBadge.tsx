import { cva } from 'class-variance-authority';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

export type StatusType = 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show';

const badgeVariants = cva('self-start px-md py-xs rounded-full', {
  variants: {
    status: {
      open: 'bg-status-open',
      assigned: 'bg-status-assigned',
      completed: 'bg-status-completed',
      cancelled: 'bg-status-cancelled',
      no_show: 'bg-danger',
    },
  },
});

const textVariants = cva('text-micro font-sans-bold uppercase', {
  variants: {
    status: {
      open: 'text-status-open-foreground',
      assigned: 'text-status-assigned-foreground',
      completed: 'text-status-completed-foreground',
      cancelled: 'text-status-cancelled-foreground',
      no_show: 'text-danger-foreground',
    },
  },
});

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  testID?: string;
}

const STATUS_LABEL_KEYS: Readonly<Record<StatusType, string>> = {
  open: 'status.open',
  assigned: 'status.assigned',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
  no_show: 'status.no_show',
};

export function StatusBadge({ status, className, testID }: StatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <View className={cn(badgeVariants({ status }), className)} testID={testID}>
      <Text className={cn(textVariants({ status }), 'tracking-badge')}>
        {t(STATUS_LABEL_KEYS[status])}
      </Text>
    </View>
  );
}
