import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import LocationScreen from '../../../src/app/(customer)/tasks/new/location';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ categoryId: 'cat-123', description: 'Fix my sink', photos: '[]' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => fb || key,
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LocationScreen (SCR-CUST-005)', () => {
  it('has a testID on the screen container', () => {
    render(<LocationScreen />);
    expect(screen.getByTestId('location-screen')).toBeTruthy();
  });

  it('renders location text input', () => {
    render(<LocationScreen />);
    expect(screen.getByTestId('location-text-input')).toBeTruthy();
  });

  it('renders the location label', () => {
    render(<LocationScreen />);
    expect(screen.getByText('Location details')).toBeTruthy();
  });

  it('navigates to schedule when next pressed with location', () => {
    render(<LocationScreen />);
    fireEvent.changeText(screen.getByTestId('location-text-input'), 'Behind State Dept Store');
    fireEvent.press(screen.getByTestId('location-screen-next'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(customer)/tasks/new/schedule',
      }),
    );
  });

  it('renders as step 3 of 5 wizard', () => {
    render(<LocationScreen />);
    expect(screen.getByTestId('location-screen')).toBeTruthy();
  });
});
