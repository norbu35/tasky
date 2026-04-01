import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { PermissionPrimer } from '../../components/ui';
import { requestNotificationPermission } from '../../utils/permissions';
import { useAppStore } from '../../store/appStore';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing } = mobileTheme;

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
    <View style={styles.container} testID="permission-notifications-screen">
      <PermissionPrimer
        icon={<Bell size={48} color={colors.primaryDeep} />}
        title={t('auth.permissions.notificationsTitle', 'Мэдэгдэл авах зөвшөөрөл')}
        description={t(
          'auth.permissions.notificationsDescription',
          'Шинэ даалгавар, мессеж, захиалгын мэдэгдэл авахад хэрэгтэй',
        )}
        deniedMessage={t('auth.permissions.notificationsDenied', 'Мэдэгдлийн зөвшөөрөл хаагдсан')}
        settingsHint={t(
          'auth.permissions.notificationsSettings',
          'Тохиргооноос мэдэгдлийг нээх боломжтой',
        )}
        continueLabel={t('auth.permissions.continue', 'Үргэлжлүүлэх')}
        allowLabel={t('auth.permissions.allow', 'Зөвшөөрөх')}
        skipLabel={t('auth.permissions.skip', 'Дараа')}
        badgeLabel="!"
        isDenied={isDenied}
        onGrant={() => {
          void handleGrant();
        }}
        onSkip={finishFlow}
        onContinue={finishFlow}
        testID="permission-notifications-primer"
      />

      <View style={styles.progress} testID="permission-notifications-progress">
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progress: {
    position: 'absolute',
    bottom: spacing['2xl'],
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primaryDeep,
  },
});
