import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';

import { getStatusLabel, mapStatus } from './model';

interface StatusSectionProps {
  status: string;
}

export function StatusSection({ status }: StatusSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row justify-between items-center mb-xl">
      <Text className="text-subtitle font-semibold text-primary">{getStatusLabel(status, t)}</Text>
      <StatusBadge status={mapStatus(status)} />
    </View>
  );
}
