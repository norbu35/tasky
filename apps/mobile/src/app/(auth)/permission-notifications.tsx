import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { PermissionPrimer } from '../../components/ui';
import { ScreenContainer } from '../../components/shells';
import { requestNotificationPermission } from '../../utils/permissions';
import { useAppStore } from '../../store/appStore';
import { mobileTheme } from '../../design/tokenAdapter';

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
        title={t('auth.permissions.notifications.title', 'Мэдэгдэл авах зөвшөөрөл')}
        description={t(
          'auth.permissions.notifications.description',
          'Шинэ өргөдөл, захиалгын мэдээллийг цаг тухайд нь авахын тулд мэдэгдлийг зөвшөөрнө үү',
        )}
        deniedMessage={t('auth.permissions.notifications.denied', 'Мэдэгдлийн зөвшөөрөл хаагдсан')}
        settingsHint={t(
          'auth.permissions.notifications.settingsHint',
          'Тохиргооноос мэдэгдлийг нээх боломжтой',
        )}
        continueLabel={t('auth.permissions.continueLabel', 'Үргэлжлүүлэх')}
        allowLabel={t('auth.permissions.allowLabel', 'Зөвшөөрөх')}
        skipLabel={t('auth.permissions.skipLabel', 'Дараа хийх')}
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
