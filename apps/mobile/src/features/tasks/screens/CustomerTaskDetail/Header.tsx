import React from 'react';
import { Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';

interface TaskHeaderProps {
  status: string;
  description: string;
  t?: (k: string) => string;
}

export function TaskHeader({ status, description }: TaskHeaderProps) {
  return (
    <View className="gap-md">
      <View className="self-start">
        <StatusBadge
          status={
            (status === 'TASKER_MARKED_DONE' ? 'assigned' : status.toLowerCase()) as
              | 'open'
              | 'assigned'
              | 'completed'
              | 'cancelled'
              | 'no_show'
          }
        />
      </View>
      <Text className="text-heading font-display-bold text-primary-deep leading-tight">
        {description}
      </Text>
    </View>
  );
}
