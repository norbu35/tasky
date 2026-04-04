import React from 'react';
import { render, screen } from '@testing-library/react-native';

import SubscriptionScreen from '../../../src/app/(tasker)/subscription';

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

beforeEach(() => {
  mockParams = {};
});

describe('SubscriptionScreen (SCR-P3-004)', () => {
  it('renders the eligible plan selection shell', () => {
    render(<SubscriptionScreen />);

    expect(screen.getByTestId('subscription-screen')).toBeTruthy();
    expect(screen.getByText('Tasker Pro')).toBeTruthy();
    expect(screen.getByText('Бүртгүүлэх')).toBeTruthy();
  });

  it('renders the ineligible shell state', () => {
    mockParams = { state: 'ineligible' };
    render(<SubscriptionScreen />);

    expect(screen.getByText('Шаардлага хангаагүй')).toBeTruthy();
  });
});
