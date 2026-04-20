import { Star } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';

import type { CustomerTask } from './CustomerTaskDetail.model';

const { colors } = mobileTheme;

interface TaskerCardProps {
  tasker: NonNullable<CustomerTask['tasker']>;
  onPress: () => void;
  t: (k: string) => string;
}

export function TaskerCard({ tasker, onPress, t }: TaskerCardProps) {
  return (
    <Touchable
      className="bg-card rounded-lg p-lg"
      style={elevations.soft}
      onPress={onPress}
      testID="task-detail-customer-screen-tasker-card"
      accessibilityRole="button"
    >
      <View className="flex-row items-center gap-md">
        <ProfileAvatar
          uri={tasker.avatar_url}
          name={tasker.full_name}
          size="lg"
          showVerified={tasker.is_pro}
        />
        <View className="flex-1 gap-xs">
          <Text className="text-subtitle font-extrabold text-foreground">{tasker.full_name}</Text>
          <View className="flex-row items-center gap-xs">
            <Star size={16} color={colors.accent} fill={colors.accent} />
            <Text className="text-label font-bold text-foreground">{tasker.rating_avg ?? 0}</Text>
          </View>
          <Text className="text-caption text-text-secondary">
            {t('TaskDetailCustomerScreen.assignedTasker')}
          </Text>
        </View>
      </View>
    </Touchable>
  );
}
