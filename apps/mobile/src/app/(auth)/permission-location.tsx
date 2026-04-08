import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { PermissionPrimer } from '../../components/ui';
import { ScreenContainer } from '../../components/shells';
import { requestLocationPermission } from '../../utils/permissions';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function PermissionLocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDenied, setIsDenied] = React.useState(false);

  const goNext = () => {
    router.replace('/(auth)/permission-notifications');
  };

  const handleGrant = async () => {
    const result = await requestLocationPermission();
    if (result.status === 'granted' || result.status === 'unavailable') {
      goNext();
      return;
    }
    setIsDenied(true);
  };

  return (
    <ScreenContainer testID="SCR-SHARED-008">
      <PermissionPrimer
        icon={<MapPin size={48} color={colors.primaryDeep} />}
        title={t('auth.permissions.location.title')}
        description={t('PermissionLocationScreen.copy1')}
        deniedMessage={t('auth.permissions.location.denied')}
        settingsHint={t('PermissionLocationScreen.copy2')}
        continueLabel={t('auth.permissions.continueLabel')}
        allowLabel={t('auth.permissions.allowLabel')}
        skipLabel={t('auth.permissions.skipLabel')}
        isDenied={isDenied}
        onGrant={() => {
          void handleGrant();
        }}
        onSkip={goNext}
        onContinue={goNext}
        testID="permission-location-primer"
      />
    </ScreenContainer>
  );
}
