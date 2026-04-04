import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { PermissionPrimer } from '../../components/ui';
import { requestNotificationPermission } from '../../utils/permissions';
import { useAppStore } from '../../store/appStore';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function PermissionNotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const currentRole = useAppStore((state) => state.currentRole);
  const [isDenied, setIsDenied] = React.useState(false);

  const finishFlow = () => {
    completeOnboarding();
    router.replace(currentRole === 'customer' ? '/(customer)/tasks' : '/(tabs)');
  };

  const handleGrant = async () => {
    const result = await requestNotificationPermission();
    if (result.status === 'granted') {
      finishFlow();
      return;
    }
    setIsDenied(true);
  };

  return (
    <View testID="SCR-SHARED-009" style={styles.container}>
      <PermissionPrimer
        icon={<Bell size={48} color={colors.primaryDeep} />}
        title={t('auth.permissions.notificationsTitle', 'Мэдэгдэл авах зөвшөөрөл')}
        description={t(
          'auth.permissions.notificationsDescription',
          'Шинэ өргөдөл, захиалгын мэдээллийг цаг тухайд нь авахын тулд мэдэгдлийг зөвшөөрнө үү',
        )}
        deniedMessage={t('auth.permissions.notificationsDenied', 'Мэдэгдлийн зөвшөөрөл хаагдсан')}
        settingsHint={t(
          'auth.permissions.notificationsSettings',
          'Тохиргооноос мэдэгдлийг нээх боломжтой',
        )}
        continueLabel={t('auth.permissions.continue', 'Үргэлжлүүлэх')}
        allowLabel={t('auth.permissions.allow', 'Зөвшөөрөх')}
        skipLabel={t('auth.permissions.skip', 'Дараа хийх')}
        isDenied={isDenied}
        onGrant={() => {
          void handleGrant();
        }}
        onSkip={finishFlow}
        onContinue={finishFlow}
        testID="permission-notifications-primer"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
