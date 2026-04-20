import { useRouter } from 'expo-router';
import { Bell, Camera, MapPin } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/shells';
import { PermissionPrimer } from '@/components/ui';
import { mobileTheme } from '@/design/tokenAdapter';
import { useAppStore } from '@/store/appStore';
import {
  requestCameraPermission,
  requestLocationPermission,
  requestNotificationPermission,
} from '@/utils/permissions';

const { colors } = mobileTheme;

type PermissionType = 'camera' | 'location' | 'notifications';

interface PermissionScreenProps {
  permissionType: PermissionType;
}

const CONFIG: Record<
  PermissionType,
  {
    testID: string;
    screenTestID: string;
    primerTestID: string;
    nextRoute: string;
    allowUnavailable: boolean;
    isLast: boolean;
  }
> = {
  camera: {
    testID: 'camera',
    screenTestID: 'SCR-SHARED-007',
    primerTestID: 'permission-camera-primer',
    nextRoute: '/(auth)/permission-location',
    allowUnavailable: false,
    isLast: false,
  },
  location: {
    testID: 'location',
    screenTestID: 'SCR-SHARED-008',
    primerTestID: 'permission-location-primer',
    nextRoute: '/(auth)/permission-notifications',
    allowUnavailable: true,
    isLast: false,
  },
  notifications: {
    testID: 'notifications',
    screenTestID: 'SCR-SHARED-009',
    primerTestID: 'permission-notifications-primer',
    nextRoute: '/(tabs)',
    allowUnavailable: true,
    isLast: true,
  },
};

const REQUEST_FNS: Record<PermissionType, () => Promise<{ status: string }>> = {
  camera: requestCameraPermission,
  location: requestLocationPermission,
  notifications: requestNotificationPermission,
};

const ICONS: Record<PermissionType, React.ReactNode> = {
  camera: <Camera size={24} color={colors.primaryDeep} />,
  location: <MapPin size={24} color={colors.primaryDeep} />,
  notifications: <Bell size={24} color={colors.primaryDeep} />,
};

export default function PermissionScreen({ permissionType }: PermissionScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDenied, setIsDenied] = React.useState(false);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const cfg = CONFIG[permissionType];

  const goNext = () => {
    if (cfg.isLast) {
      completeOnboarding();
    }
    router.replace(cfg.nextRoute);
  };

  const handleGrant = async () => {
    const result = await REQUEST_FNS[permissionType]();
    const granted =
      result.status === 'granted' || (cfg.allowUnavailable && result.status === 'unavailable');
    if (granted) {
      goNext();
      return;
    }
    setIsDenied(true);
  };

  const key = permissionType as string;
  const titleKey = `auth.permissions.${key}.title`;
  const deniedKey = `auth.permissions.${key}.denied`;
  const capKey = `Permission${key.charAt(0).toUpperCase()}${key.slice(1)}Screen`;

  return (
    <ScreenContainer testID={cfg.screenTestID}>
      <PermissionPrimer
        icon={ICONS[permissionType]}
        title={t(titleKey)}
        description={t(`${capKey}.copy1`)}
        deniedMessage={t(deniedKey)}
        settingsHint={t(`${capKey}.copy2`)}
        continueLabel={t('auth.permissions.continueLabel')}
        allowLabel={t('auth.permissions.allowLabel')}
        skipLabel={t('auth.permissions.skipLabel')}
        isDenied={isDenied}
        onGrant={() => {
          void handleGrant();
        }}
        onSkip={goNext}
        onContinue={goNext}
        testID={cfg.primerTestID}
      />
    </ScreenContainer>
  );
}
