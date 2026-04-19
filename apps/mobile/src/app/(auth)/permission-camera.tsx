import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '../../components/shells';
import { PermissionPrimer } from '../../components/ui';
import { mobileTheme } from '../../design/tokenAdapter';
import { requestCameraPermission } from '../../utils/permissions';

const { colors } = mobileTheme;

export default function PermissionCameraScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDenied, setIsDenied] = React.useState(false);

  const goNext = () => {
    router.replace('/(auth)/permission-location');
  };

  const handleGrant = async () => {
    const result = await requestCameraPermission();
    if (result.status === 'granted') {
      goNext();
      return;
    }
    setIsDenied(true);
  };

  return (
    <ScreenContainer testID="SCR-SHARED-007">
      <PermissionPrimer
        icon={<Camera size={24} color={colors.primaryDeep} />}
        title={t('auth.permissions.camera.title')}
        description={t('PermissionCameraScreen.copy1')}
        deniedMessage={t('auth.permissions.camera.denied')}
        settingsHint={t('PermissionCameraScreen.copy2')}
        continueLabel={t('auth.permissions.continueLabel')}
        allowLabel={t('auth.permissions.allowLabel')}
        skipLabel={t('auth.permissions.skipLabel')}
        isDenied={isDenied}
        onGrant={() => {
          void handleGrant();
        }}
        onSkip={goNext}
        onContinue={goNext}
        testID="permission-camera-primer"
      />
    </ScreenContainer>
  );
}
