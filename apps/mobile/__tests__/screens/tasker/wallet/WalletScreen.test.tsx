import React from 'react';
import { render, screen } from '@testing-library/react-native';

import WalletScreen from '../../../../src/app/(tasker)/wallet';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

describe('WalletScreen (SCR-P3-001)', () => {
  it('renders the wallet balance shell', () => {
    render(<WalletScreen />);

    expect(screen.getByTestId('wallet-screen')).toBeTruthy();
    expect(screen.getByText('Хэтэвч')).toBeTruthy();
    expect(screen.getByText('Боломжит үлдэгдэл')).toBeTruthy();
    expect(screen.getByText('Мөнгө татах')).toBeTruthy();
  });
});
