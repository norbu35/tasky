import React from 'react';
import { render, screen } from '@testing-library/react-native';

import WalletScreen from '../../../../src/app/(tasker)/wallet';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

describe('WalletScreen (SCR-P3-001)', () => {
  it('renders the wallet balance shell', () => {
    render(<WalletScreen />);

    expect(screen.getByTestId('SCR-P3-001')).toBeTruthy();
    expect(screen.getByText('Wallet')).toBeTruthy();
    expect(screen.getByText('Available Balance')).toBeTruthy();
    expect(screen.getByText('Request Payout')).toBeTruthy();
  });
});
