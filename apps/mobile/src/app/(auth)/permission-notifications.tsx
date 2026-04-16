import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '../../components/shells';
import { PermissionPrimer } from '../../components/ui';
import { mobileTheme } from '../../design/tokenAdapter';
import { useAppStore } from '../../store/appStore';
import { requestNotificationPermission } from '../../utils/permissions';

const { colors } = mobileTheme;

export default function PermissionNotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [isDenied, setIsDenied] = React.useState(false);

  const finishFlow = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleGrant = async () => {
    const result = await requestNotificationPermission();
    if (result.status === 'granted' || result.status === 'unavailable') {
      finishFlow();
      return;
    }
    setIsDenied(true);
  };

  return (
    <ScreenContainer testID="SCR-SHARED-009">
      <PermissionPrimer
        icon={<Bell size={48} color={colors.primaryDeep} />}
        title={t('auth.permissions.notifications.title')}
        description={t('PermissionNotificationsScreen.copy1')}
        deniedMessage={t('auth.permissions.notifications.denied')}
        settingsHint={t('PermissionNotificationsScreen.copy2')}
        continueLabel={t('auth.permissions.continueLabel')}
        allowLabel={t('auth.permissions.allowLabel')}
        skipLabel={t('auth.permissions.skipLabel')}
        isDenied={isDenied}
        onGrant={() => {
          void handleGrant();
        }}
        onSkip={finishFlow}
        onContinue={finishFlow}
        testID="permission-notifications-primer"
      />
    </ScreenContainer>
  );
}
