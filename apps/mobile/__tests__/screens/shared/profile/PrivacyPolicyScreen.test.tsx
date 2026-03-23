import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      const fb = typeof fallback === 'string' ? fallback : key;
      return fb;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetBackdrop: View,
    BottomSheetView: View,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
  );
});

describe('PrivacyPolicyScreen (SCR-TASK-018)', () => {
  it('renders the privacy policy title', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
  });

  it('renders scrollable content sections', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText('Data Collection')).toBeTruthy();
    expect(screen.getByText('Data Usage')).toBeTruthy();
    expect(screen.getByText('Data Storage')).toBeTruthy();
  });

  it('renders back button that navigates back', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);
    fireEvent.press(screen.getByTestId('privacy-screen-back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders identity verification section', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText('Identity Verification Data')).toBeTruthy();
  });

  it('renders user rights section', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText('User Rights')).toBeTruthy();
  });
});
