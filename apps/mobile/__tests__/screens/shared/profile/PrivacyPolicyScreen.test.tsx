import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

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
  beforeEach(() => {
    resetTestI18n();
    setTestLanguage('mn');
  });

  it('renders scrollable content sections', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText('Мэдээлэл цуглуулах')).toBeTruthy();
    expect(screen.getByText('Мэдээллийн ашиглалт')).toBeTruthy();
    expect(screen.getAllByText(/Мэдээлэл хадгалах/).length).toBeGreaterThan(0);
  });

  it('renders identity verification section', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText('Таниулах баталгаажуулалтын мэдээлэл')).toBeTruthy();
  });

  it('renders user rights section', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText('Хэрэглэгчийн эрх')).toBeTruthy();
  });

  it('renders the last updated label and support email card', () => {
    const PrivacyPolicyScreen = require('../../../../src/app/(shared)/legal/privacy').default;
    render(<PrivacyPolicyScreen />);

    expect(screen.getByText('Сүүлд шинэчлэгдсэн: 2026.01.01')).toBeTruthy();
    expect(screen.getByText('support@tasky.mn')).toBeTruthy();
  });
});
