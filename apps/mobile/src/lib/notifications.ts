import { Platform } from 'react-native';

import { mobileTheme } from '../design/theme';

import { isNativeFirebaseAvailable } from './nativeFirebase';

const { colors } = mobileTheme;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || !isNativeFirebaseAvailable()) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const notifee = require('@notifee/react-native').default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AndroidImportance } = require('@notifee/react-native');
  await notifee.createChannel({
    id: 'default',
    name: 'Default',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [250, 250, 250, 250],
    lights: true,
    lightColor: colors.trust,
  });
}

async function requestPermission(): Promise<boolean> {
  if (!isNativeFirebaseAvailable()) return false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const messaging = require('@react-native-firebase/messaging').default;
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

interface PushRegistrationResult {
  token?: string;
  error?: string;
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (!isNativeFirebaseAvailable()) {
    return {};
  }
  try {
    await ensureAndroidChannel();

    const granted = await requestPermission();
    if (!granted) {
      return { error: 'Permission not granted to get push token for push notification!' };
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messaging = require('@react-native-firebase/messaging').default;
    const token = await messaging().getToken();
    return { token };
  } catch (e: unknown) {
    return { error: `${e}` };
  }
}
