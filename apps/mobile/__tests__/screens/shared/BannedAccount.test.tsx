import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
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
});

describe('BannedAccountScreen (SCR-SHARED-021)', () => {
  it('renders the banned message', () => {
    const BannedScreen = require('../../../src/app/(shared)/account/banned').default;
    render(<BannedScreen />);

    expect(screen.getByText('Бүртгэл хаагдсан')).toBeTruthy();
    expect(
      screen.getByText(
        'Таны бүртгэл үйлчилгээний нөхцөл зөрчсөний улмаас бүрмөсөн хаагдсан байна. Энэ шийдвэрийг буцаах боломжгүй.',
      ),
    ).toBeTruthy();
  });

  it('has support and logout actions but no appeal flow', () => {
    const BannedScreen = require('../../../src/app/(shared)/account/banned').default;
    render(<BannedScreen />);

    expect(screen.getByText('Тусламж авах')).toBeTruthy();
    expect(screen.getByText('Гарах')).toBeTruthy();
    expect(screen.queryByTestId('banned-screen-retry')).toBeNull();
    expect(screen.queryByText('Гомдол гаргах')).toBeNull();
  });

  it('logs the user out to the auth flow', () => {
    const BannedScreen = require('../../../src/app/(shared)/account/banned').default;
    render(<BannedScreen />);

    fireEvent.press(screen.getByText('Гарах'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)');
  });

  it('has correct testID on root container', () => {
    const BannedScreen = require('../../../src/app/(shared)/account/banned').default;
    render(<BannedScreen />);

    expect(screen.getByTestId('banned-screen')).toBeTruthy();
  });
});
