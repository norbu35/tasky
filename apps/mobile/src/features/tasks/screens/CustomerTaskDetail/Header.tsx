import React from 'react';
import { Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { mobileSurfaces } from '@/design/surfaces';

interface TaskHeaderProps {
  status: string;
  description: string;
  t: (k: string) => string;
}

const { taskDetail } = mobileSurfaces;

export function TaskHeader({ status, description, t }: TaskHeaderProps) {
  return (
    <View className="gap-sm">
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
      <Text className="text-heading font-display-bold text-primary-deep leading-tight">
        {description}
      </Text>
      <Text
        className="text-caption font-bold text-text-secondary uppercase"
        style={{ letterSpacing: taskDetail.sectionTracking }}
      >
        {t('TaskDetailCustomerScreen.sectionDetails')}
      </Text>
    </View>
  );
}
