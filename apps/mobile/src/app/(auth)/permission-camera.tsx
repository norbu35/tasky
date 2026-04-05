import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react-native';
import { PermissionPrimer } from '../../components/ui';
import { ScreenContainer } from '../../components/shells';
import { requestCameraPermission } from '../../utils/permissions';
import { mobileTheme } from '../../design/tokenAdapter';

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
        icon={<Camera size={48} color={colors.primaryDeep} />}
        title={t('auth.permissions.camera.title', 'Камер ашиглах зөвшөөрөл')}
        description={t(
          'auth.permissions.camera.description',
          'Зураг оруулах, баталгаажуулалт хийхэд камер хэрэгтэй',
        )}
        deniedMessage={t('auth.permissions.camera.denied', 'Камерын зөвшөөрөл хаагдсан')}
        settingsHint={t(
          'auth.permissions.camera.settingsHint',
          'Тохиргооноос камерыг нээх боломжтой',
        )}
        continueLabel={t('auth.permissions.continueLabel', 'Үргэлжлүүлэх')}
        allowLabel={t('auth.permissions.allowLabel', 'Зөвшөөрөх')}
        skipLabel={t('auth.permissions.skipLabel', 'Дараа хийх')}
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
