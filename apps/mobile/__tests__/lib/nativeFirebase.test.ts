function loadNativeFirebase(constants: unknown) {
  jest.resetModules();
  jest.doMock('expo-constants', () => constants);
  return require('../../src/lib/nativeFirebase') as typeof import('../../src/lib/nativeFirebase');
}

describe('native Firebase availability', () => {
  afterEach(() => {
    jest.dontMock('expo-constants');
  });

  it('stays disabled in Expo Go even when config is present', () => {
    const { isNativeFirebaseAvailable } = loadNativeFirebase({
      executionEnvironment: 'storeClient',
      expoConfig: { extra: { nativeFirebase: { enabled: true } } },
    });

    expect(isNativeFirebaseAvailable()).toBe(false);
  });

  it('stays disabled in local dev builds without Firebase config', () => {
    const { isNativeFirebaseAvailable } = loadNativeFirebase({
      executionEnvironment: 'bare',
      expoConfig: { extra: { nativeFirebase: { enabled: false } } },
    });

    expect(isNativeFirebaseAvailable()).toBe(false);
  });

  it('enables native Firebase only when build config declares it', () => {
    const { isNativeFirebaseAvailable } = loadNativeFirebase({
      executionEnvironment: 'bare',
      expoConfig: { extra: { nativeFirebase: { enabled: true } } },
    });

    expect(isNativeFirebaseAvailable()).toBe(true);
  });
});
