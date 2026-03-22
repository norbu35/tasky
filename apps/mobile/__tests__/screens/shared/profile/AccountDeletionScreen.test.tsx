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
    return { __esModule: true, default: View, BottomSheetModal: View, BottomSheetModalProvider: View, BottomSheetBackdrop: View, BottomSheetView: View };
});

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return new Proxy({}, { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> });
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
        expect(screen.getByText(/cannot be undone/)).toBeTruthy();
    });

    it('shows delete and cancel buttons', () => {
        const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
        render(<AccountDeletionScreen />);
        expect(screen.getByText('Delete My Account')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('confirm button triggers deletion', () => {
        const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
        render(<AccountDeletionScreen />);
        fireEvent.press(screen.getByText('Delete My Account'));
        expect(mockDeleteAccount).toHaveBeenCalled();
    });

    it('cancel button goes back', () => {
        const AccountDeletionScreen = require('../../../../src/app/(shared)/profile/delete').default;
        render(<AccountDeletionScreen />);
        fireEvent.press(screen.getByText('Cancel'));
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
        expect(screen.getByText(/active bookings/)).toBeTruthy();
    });
});
