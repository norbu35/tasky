import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

async function ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android' || isExpoGo) return;
    const notifee = require('@notifee/react-native').default;
    const { AndroidImportance } = require('@notifee/react-native');
    await notifee.createChannel({
        id: 'default',
        name: 'Default',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [0, 250, 250, 250],
        lights: true,
        lightColor: '#FF231F7C',
    });
}

async function requestPermission(): Promise<boolean> {
    if (isExpoGo) return false;
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
    if (isExpoGo) {
        return { error: 'Push notifications not available in Expo Go' };
    }
    try {
        await ensureAndroidChannel();

        const granted = await requestPermission();
        if (!granted) {
            return { error: 'Permission not granted to get push token for push notification!' };
        }

        const messaging = require('@react-native-firebase/messaging').default;
        const token = await messaging().getToken();
        return { token };
    } catch (e: unknown) {
        return { error: `${e}` };
    }
}
