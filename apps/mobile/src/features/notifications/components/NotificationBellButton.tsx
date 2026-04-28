import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

export function NotificationBellButton({ testID = 'top-notifications' }: { testID?: string }) {
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    router.push('/(shared)/notifications');
  }, [router]);

  return (
    <Touchable
      className="h-11 w-11 items-center justify-center rounded-full bg-muted"
      style={elevations.soft}
      onPress={handlePress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t('shared.notifications.title')}
    >
      <Bell size={20} color={colors.primary} />
    </Touchable>
  );
}
