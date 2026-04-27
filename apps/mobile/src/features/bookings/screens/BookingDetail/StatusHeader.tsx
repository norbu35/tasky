import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';

import { getStatusLabel, mapStatus } from './model';

interface StatusSectionProps {
  status: string;
  showRecoveryNotice?: boolean;
}

export function StatusSection({ status, showRecoveryNotice = false }: StatusSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-lg border-b border-border pb-lg" testID="booking-detail-status-section">
      <View className="flex-row justify-between items-center">
        <View className="flex-1 pr-md">
          <Text className="text-caption text-text-secondary mb-xs">
            {t('customer.bookings.detailTitle')}
          </Text>
          <Text className="text-heading font-display-bold text-primary-deep">
            {getStatusLabel(status, t)}
          </Text>
        </View>
        <StatusBadge status={mapStatus(status)} />
      </View>
      {showRecoveryNotice ? (
        <View className="mt-md rounded-md border border-border bg-muted p-md">
          <Text className="text-body font-semibold text-primary-deep">
            {t('customer.bookings.recoveryTitle')}
          </Text>
          <Text className="mt-xs text-caption text-text-secondary">
            {t('customer.bookings.recoveryBody')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
