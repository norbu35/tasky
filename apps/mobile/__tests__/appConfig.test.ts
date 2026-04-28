import { resolveGoogleMapsApiKeys } from '../app.config';

describe('mobile app config Google Maps env resolution', () => {
  it('leaves native keys unset when process and app-local env are blank', () => {
    const keys = resolveGoogleMapsApiKeys(
      {
        GOOGLE_MAPS_API_KEY: '',
        GOOGLE_MAPS_ANDROID_API_KEY: '',
        GOOGLE_MAPS_IOS_API_KEY: '',
      },
      {},
      {
        GOOGLE_MAPS_API_KEY: 'root-key',
      },
    );

    expect(keys).toEqual({
      androidApiKey: undefined,
      iosApiKey: undefined,
    });
  });

  it('prefers platform-specific keys over the shared key', () => {
    const keys = resolveGoogleMapsApiKeys(
      {
        GOOGLE_MAPS_API_KEY: 'shared-key',
        GOOGLE_MAPS_ANDROID_API_KEY: 'android-key',
        GOOGLE_MAPS_IOS_API_KEY: 'ios-key',
      },
      {},
    );

    expect(keys).toEqual({
      androidApiKey: 'android-key',
      iosApiKey: 'ios-key',
    });
  });

  it('uses app-local env values when process env is blank', () => {
    const keys = resolveGoogleMapsApiKeys(
      {
        GOOGLE_MAPS_API_KEY: '',
      },
      {
        GOOGLE_MAPS_API_KEY: 'app-local-key',
      },
      {
        GOOGLE_MAPS_API_KEY: 'root-key',
      },
    );

    expect(keys).toEqual({
      androidApiKey: 'app-local-key',
      iosApiKey: 'app-local-key',
    });
  });
});
