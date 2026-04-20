export const UB_CENTER = { latitude: 47.9184, longitude: 106.9177 };
export const DEFAULT_DELTA = 0.05;
export const ZOOM_DELTA = 0.02;
export const ANIMATE_DURATION = 600;

export function makeRegion(latitude: number, longitude: number, delta: number = DEFAULT_DELTA) {
  return { latitude, longitude, latitudeDelta: delta, longitudeDelta: delta };
}
