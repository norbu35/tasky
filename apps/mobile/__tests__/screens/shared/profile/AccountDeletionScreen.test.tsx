import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: mockBack }),
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

const mockDeleteAccount = jest.fn();
const mockUseDeleteAccount = jest.fn();

jest.mock('../../../../src/features/profile/hooks/useDeleteAccount', () => ({
  useDeleteAccount: () => mockUseDeleteAccount(),
}));

jest.mock('../../../../src/store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ session: { accessToken: 'test-token' } }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDeleteAccount.mockReturnValue({
    mutate: mockDeleteAccount,
    isPending: false,
    error: null,
  });
});

describe('AccountDeletionScreen (SCR-SHARED-015)', () => {
  it('shows warning text', () => {
    const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
    render(<AccountDeletionScreen />);
    expect(
      screen.getByText(
        'Та бүртгэлээ устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй бөгөөд таны бүх мэдээлэл бүрмөсөн устгагдана.',
      ),
    ).toBeTruthy();
  });

  it('shows delete and cancel buttons', () => {
    const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
    render(<AccountDeletionScreen />);
    expect(screen.getByText('Бүртгэлээ устгах')).toBeTruthy();
    expect(screen.getByText('Болих')).toBeTruthy();
  });

  it('confirm button triggers deletion', () => {
    const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
    render(<AccountDeletionScreen />);
    fireEvent.changeText(screen.getByTestId('delete-confirmation-input'), 'DELETE');
    fireEvent.press(screen.getByText('Бүртгэлээ устгах'));
    expect(mockDeleteAccount).toHaveBeenCalled();
  });

  it('cancel button goes back', () => {
    const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
    render(<AccountDeletionScreen />);
    fireEvent.press(screen.getByText('Болих'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('shows loading state during deletion', () => {
    mockUseDeleteAccount.mockReturnValue({
      mutate: mockDeleteAccount,
      isPending: true,
      error: null,
    });
    const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
    render(<AccountDeletionScreen />);
    expect(screen.getByTestId('delete-account-screen')).toBeTruthy();
  });

  it('shows blocked state when active bookings', () => {
    mockUseDeleteAccount.mockReturnValue({
      mutate: mockDeleteAccount,
      isPending: false,
      error: { code: 'ACTIVE_BOOKINGS' },
    });
    const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
    render(<AccountDeletionScreen />);
    expect(
      screen.getByText(
        'Танд идэвхтэй захиалга байна. Бүртгэлээ устгахын өмнө бүх захиалгаа дуусгах эсвэл цуцлах шаардлагатай.',
      ),
    ).toBeTruthy();
  });

  it('requires confirmation text before enabling deletion', () => {
    const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
    render(<AccountDeletionScreen />);

    expect(screen.getByTestId('delete-confirm-button').props.accessibilityState.disabled).toBe(
      true,
    );

    fireEvent.changeText(screen.getByTestId('delete-confirmation-input'), 'DELETE');

    expect(screen.getByTestId('delete-confirm-button').props.accessibilityState.disabled).toBe(
      false,
    );
  });

  it('shows blocked state when open disputes prevent deletion', () => {
    mockUseDeleteAccount.mockReturnValue({
      mutate: mockDeleteAccount,
      isPending: false,
      error: { code: 'OPEN_DISPUTES' },
    });
    const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
    render(<AccountDeletionScreen />);

    expect(
      screen.getByText(
        'Танд шийдвэрлэгдээгүй маргаан байна. Бүртгэлээ устгахын өмнө бүх маргааныг шийдвэрлэх шаардлагатай.',
      ),
    ).toBeTruthy();
  });
});
