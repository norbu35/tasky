export const UB_CENTER = { latitude: 47.9184, longitude: 106.9177 };
export const DEFAULT_DELTA = 0.05;
export const ZOOM_DELTA = 0.02;
export const ANIMATE_DURATION = 600;

export function makeRegion(latitude: number, longitude: number, delta: number = DEFAULT_DELTA) {
  return { latitude, longitude, latitudeDelta: delta, longitudeDelta: delta };
}

type GoogleMapsSdkConfig = {
  androidEnabled?: boolean;
  iosEnabled?: boolean;
};

export type TaskLocationAppExtra = {
  googleMapsSdk?: GoogleMapsSdkConfig;
};

export function shouldUseGoogleMapsProvider(
  platform: string,
  appExtra: TaskLocationAppExtra | undefined,
): boolean {
  if (platform === 'android') {
    return appExtra?.googleMapsSdk?.androidEnabled === true;
  }
  if (platform === 'ios') {
    return appExtra?.googleMapsSdk?.iosEnabled === true;
  }
  return false;
}

export function getGoogleMapsRenderer(
  platform: string,
  useGoogleMapsProvider: boolean,
): 'LEGACY' | undefined {
  return platform === 'android' && useGoogleMapsProvider ? 'LEGACY' : undefined;
}
