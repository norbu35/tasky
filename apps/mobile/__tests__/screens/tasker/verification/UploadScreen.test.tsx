import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      return typeof fallback === 'string' ? fallback : key;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

const mockLaunchCamera = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [{ uri: 'file://photo.jpg' }],
});
const mockLaunchLibrary = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [{ uri: 'file://photo.jpg' }],
});

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: (...args: any[]) => mockLaunchCamera(...args),
  launchImageLibraryAsync: (...args: any[]) => mockLaunchLibrary(...args),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockGetUploadUrl = jest.fn().mockResolvedValue({
  upload_url: 'https://upload.example.com/presigned',
  storage_key: 'key-front-123',
});
const mockSubmitVerification = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../../src/features/verification/hooks/useVerificationUpload', () => ({
  useVerificationUpload: () => ({
    getUploadUrl: mockGetUploadUrl,
    uploadPhoto: jest.fn().mockResolvedValue('key-123'),
    isUploading: false,
  }),
}));

jest.mock('../../../../src/features/verification/hooks/useVerification', () => ({
  useVerification: () => ({
    submitVerification: mockSubmitVerification,
    isSubmitting: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('UploadScreen (SCR-TASK-005)', () => {
  it('shows step 1 with ID front instructions', () => {
    const UploadScreen = require('../../../../src/app/(tasker)/verification/upload').default;
    render(<UploadScreen />);

    expect(screen.getByTestId('SCR-TASK-005')).toBeTruthy();
    expect(screen.getByText('tasker.verification.uploadFront')).toBeTruthy();
  });

  it('shows camera and gallery buttons', () => {
    const UploadScreen = require('../../../../src/app/(tasker)/verification/upload').default;
    render(<UploadScreen />);

    expect(screen.getByTestId('capture-camera-btn')).toBeTruthy();
    expect(screen.getByTestId('capture-gallery-btn')).toBeTruthy();
  });

  it('advances to step 2 (back) after capturing front photo and pressing next', async () => {
    const UploadScreen = require('../../../../src/app/(tasker)/verification/upload').default;
    render(<UploadScreen />);

    // Capture front photo
    fireEvent.press(screen.getByTestId('capture-camera-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });

    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadBack')).toBeTruthy();
    });
  });

  it('advances to step 3 (selfie) after capturing back photo and pressing next', async () => {
    const UploadScreen = require('../../../../src/app/(tasker)/verification/upload').default;
    render(<UploadScreen />);

    // Step 1 - front
    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    // Step 2 - back
    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadBack')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    // Step 3 - selfie
    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadSelfie')).toBeTruthy();
    });
  });

  it('submit calls submitVerification after all 3 photos captured', async () => {
    const UploadScreen = require('../../../../src/app/(tasker)/verification/upload').default;
    render(<UploadScreen />);

    // Step 1 - front
    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    // Step 2 - back
    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadBack')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    // Step 3 - selfie
    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadSelfie')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });

    // Submit (final step next label becomes submit)
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    await waitFor(() => {
      expect(mockSubmitVerification).toHaveBeenCalledTimes(1);
    });
  });

  it('gallery button launches image library', async () => {
    const UploadScreen = require('../../../../src/app/(tasker)/verification/upload').default;
    render(<UploadScreen />);

    fireEvent.press(screen.getByTestId('capture-gallery-btn'));

    await waitFor(() => {
      expect(mockLaunchLibrary).toHaveBeenCalled();
    });
  });

  it('shows a review section once all three photos are captured', async () => {
    const UploadScreen = require('../../../../src/app/(tasker)/verification/upload').default;
    render(<UploadScreen />);

    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadBack')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadSelfie')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('capture-camera-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('verification-review')).toBeTruthy();
      expect(screen.getByTestId('retake-front-btn')).toBeTruthy();
      expect(screen.getByTestId('retake-back-btn')).toBeTruthy();
      expect(screen.getByTestId('retake-selfie-btn')).toBeTruthy();
    });
  });

  it('retakes the front photo from the review section', async () => {
    const UploadScreen = require('../../../../src/app/(tasker)/verification/upload').default;
    render(<UploadScreen />);

    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadBack')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('capture-camera-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('SCR-TASK-005-next')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('SCR-TASK-005-next'));

    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadSelfie')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('capture-camera-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('verification-review')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('retake-front-btn'));

    await waitFor(() => {
      expect(screen.getByText('tasker.verification.uploadFront')).toBeTruthy();
      expect(screen.queryByTestId('verification-review')).toBeNull();
    });
  });
});
