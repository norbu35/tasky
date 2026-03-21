import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

// Android notification channel — mirrors the previous expo-notifications channel.
// Called once on app start before token acquisition.
async function ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
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
    try {
        await ensureAndroidChannel();

        const granted = await requestPermission();
        if (!granted) {
            return { error: 'Permission not granted to get push token for push notification!' };
        }

        const token = await messaging().getToken();
        return { token };
    } catch (e: unknown) {
        return { error: `${e}` };
    }
}
