describe('requestCameraPermission', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('requests camera permission via expo-image-picker', async () => {
    const mockRequestCameraPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });

    jest.doMock('expo-image-picker', () => ({
      requestCameraPermissionsAsync: mockRequestCameraPermissionsAsync,
    }));

    let requestCameraPermission!: () => Promise<{ status: string }>;
    jest.isolateModules(() => {
      ({ requestCameraPermission } = require('../../src/utils/permissions'));
    });

    await expect(requestCameraPermission()).resolves.toEqual({ status: 'granted' });
    expect(mockRequestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});
