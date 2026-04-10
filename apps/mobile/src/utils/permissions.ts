/**
 * Thin wrappers around expo permission APIs.
 * Extracted so screens can be tested without installing optional native permission modules.
 */

export async function requestCameraPermission(): Promise<{ status: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require('expo-image-picker');
    return await ImagePicker.requestCameraPermissionsAsync();
  } catch {
    return { status: 'unavailable' };
  }
}

export async function requestLocationPermission(): Promise<{ status: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    return { status };
  } catch {
    return { status: 'unavailable' };
  }
}

/**
 * Returns current device coordinates if foreground location permission is granted.
 * Returns null if permission is denied or location unavailable.
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location = require('expo-location');
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return null;
  }
}

// expo-notifications is not yet installed — return unavailable until it is added
export async function requestNotificationPermission(): Promise<{ status: string }> {
  return { status: 'unavailable' };
}
