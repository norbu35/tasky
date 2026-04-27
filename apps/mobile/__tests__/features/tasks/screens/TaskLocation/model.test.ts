import {
  getGoogleMapsRenderer,
  shouldUseGoogleMapsProvider,
} from '@/features/tasks/screens/TaskLocation/model';

describe('TaskLocation map provider config', () => {
  it('uses Google Maps on Android when the native SDK key is configured', () => {
    expect(
      shouldUseGoogleMapsProvider('android', {
        googleMapsSdk: { androidEnabled: true, iosEnabled: false },
      }),
    ).toBe(true);
  });

  it('uses Google Maps on iOS when the native SDK key is configured', () => {
    expect(
      shouldUseGoogleMapsProvider('ios', {
        googleMapsSdk: { androidEnabled: false, iosEnabled: true },
      }),
    ).toBe(true);
  });

  it('keeps the fallback map provider when no platform key is configured', () => {
    expect(shouldUseGoogleMapsProvider('android', undefined)).toBe(false);
    expect(shouldUseGoogleMapsProvider('ios', { googleMapsSdk: {} })).toBe(false);
    expect(
      shouldUseGoogleMapsProvider('web', {
        googleMapsSdk: { androidEnabled: true, iosEnabled: true },
      }),
    ).toBe(false);
  });

  it('uses the legacy Google renderer on Android to avoid local Fabric map crashes', () => {
    expect(getGoogleMapsRenderer('android', true)).toBe('LEGACY');
    expect(getGoogleMapsRenderer('android', false)).toBeUndefined();
    expect(getGoogleMapsRenderer('ios', true)).toBeUndefined();
  });
});
