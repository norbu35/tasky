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

type PermissionType = 'notifications' | 'camera' | 'location';

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
  notifications: {
    testID: 'notifications',
    screenTestID: 'SCR-SHARED-009',
    primerTestID: 'permission-notifications-primer',
    nextRoute: '/(tabs)',
    allowUnavailable: true,
    isLast: true,
  },
  camera: {
    testID: 'camera',
    screenTestID: 'SCR-SHARED-007',
    primerTestID: 'permission-camera-primer',
    nextRoute: '/(tabs)',
    allowUnavailable: true,
    isLast: false,
  },
  location: {
    testID: 'location',
    screenTestID: 'SCR-SHARED-008',
    primerTestID: 'permission-location-primer',
    nextRoute: '/(tabs)',
    allowUnavailable: true,
    isLast: false,
  },
};

const PERMISSION_COPY_KEYS: Record<
  PermissionType,
  {
    titleKey: string;
    descriptionKey: string;
    deniedKey: string;
    settingsHintKey: string;
  }
> = {
  notifications: {
    titleKey: 'auth.permissions.notifications.title',
    descriptionKey: 'auth.permissions.notifications.description',
    deniedKey: 'auth.permissions.notifications.denied',
    settingsHintKey: 'auth.permissions.notifications.settingsHint',
  },
  camera: {
    titleKey: 'auth.permissions.camera.title',
    descriptionKey: 'auth.permissions.camera.description',
    deniedKey: 'auth.permissions.camera.denied',
    settingsHintKey: 'auth.permissions.camera.settingsHint',
  },
  location: {
    titleKey: 'auth.permissions.location.title',
    descriptionKey: 'auth.permissions.location.description',
    deniedKey: 'auth.permissions.location.denied',
    settingsHintKey: 'auth.permissions.location.settingsHint',
  },
};

const REQUEST_FNS: Record<PermissionType, () => Promise<{ status: string }>> = {
  notifications: requestNotificationPermission,
  camera: requestCameraPermission,
  location: requestLocationPermission,
};

const ICONS: Record<PermissionType, React.ReactNode> = {
  notifications: <Bell size={24} color={colors.primaryDeep} />,
  camera: <Camera size={24} color={colors.primaryDeep} />,
  location: <MapPin size={24} color={colors.primaryDeep} />,
};

export default function PermissionScreen({ permissionType }: PermissionScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDenied, setIsDenied] = React.useState(false);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const cfg = CONFIG[permissionType];
  const copyKeys = PERMISSION_COPY_KEYS[permissionType];

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

  const { titleKey, descriptionKey, deniedKey, settingsHintKey } = copyKeys;

  return (
    <ScreenContainer testID={cfg.screenTestID}>
      <PermissionPrimer
        icon={ICONS[permissionType]}
        title={t(titleKey)}
        description={t(descriptionKey)}
        deniedMessage={t(deniedKey)}
        settingsHint={t(settingsHintKey)}
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
