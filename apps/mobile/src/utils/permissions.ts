/**
 * Thin wrappers around expo permission APIs.
 * Extracted so screens can be tested without installing expo-camera/location/notifications.
 */

export async function requestCameraPermission(): Promise<{ status: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ExpoCamera = require('expo-camera');
    return await ExpoCamera.requestCameraPermissionsAsync();
  } catch {
    return { status: 'unavailable' };
  }
}

export async function requestLocationPermission(): Promise<{ status: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location = require('expo-location');
    return await Location.requestForegroundPermissionsAsync();
  } catch {
    return { status: 'unavailable' };
  }
}

export async function requestNotificationPermission(): Promise<{ status: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications');
    return await Notifications.requestPermissionsAsync();
  } catch {
    return { status: 'unavailable' };
  }
}
