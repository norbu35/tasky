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

// expo-location is not yet installed — return unavailable until it is added
export async function requestLocationPermission(): Promise<{ status: string }> {
  return { status: 'unavailable' };
}

// expo-notifications is not yet installed — return unavailable until it is added
export async function requestNotificationPermission(): Promise<{ status: string }> {
  return { status: 'unavailable' };
}
