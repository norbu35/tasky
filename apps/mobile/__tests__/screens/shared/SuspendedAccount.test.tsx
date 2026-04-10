import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
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
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
  );
});

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
});

describe('SuspendedAccountScreen (SCR-SHARED-020)', () => {
  it('renders the suspended message', () => {
    const SuspendedScreen = require('../../../src/app/(shared)/account/suspended').default;
    render(<SuspendedScreen />);

    expect(screen.getByText('Бүртгэл түр хаагдсан')).toBeTruthy();
    expect(
      screen.getByText(
        'Таны хаягийг манай үйлчилгээний нөхцөл зөрчсөн тул түр хугацаагаар хязгаарлалаа.',
      ),
    ).toBeTruthy();
  });

  it('shows expiry date when provided via route params', () => {
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({
      expiryDate: '2026-04-15',
    });

    const SuspendedScreen = require('../../../src/app/(shared)/account/suspended').default;
    render(<SuspendedScreen />);

    expect(screen.getByText('Хаалт дуусах: 2026.04.15')).toBeTruthy();
  });

  it('renders appeal button', () => {
    const SuspendedScreen = require('../../../src/app/(shared)/account/suspended').default;
    render(<SuspendedScreen />);

    expect(screen.getByText('Гомдол гаргах')).toBeTruthy();
  });

  it('renders logout action and returns the user to login', () => {
    const SuspendedScreen = require('../../../src/app/(shared)/account/suspended').default;
    render(<SuspendedScreen />);

    fireEvent.press(screen.getByText('Гарах'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)');
  });

  it('has correct testID on root container', () => {
    const SuspendedScreen = require('../../../src/app/(shared)/account/suspended').default;
    render(<SuspendedScreen />);

    expect(screen.getByTestId('SCR-SHARED-020')).toBeTruthy();
  });
});
