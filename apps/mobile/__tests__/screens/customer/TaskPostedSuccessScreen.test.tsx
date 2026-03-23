import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import TaskPostedSuccessScreen from '../../../src/app/(customer)/tasks/new/success';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({}),
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

describe('TaskPostedSuccessScreen (SCR-CUST-008)', () => {
  it('has a testID on the screen container', () => {
    render(<TaskPostedSuccessScreen />);
    expect(screen.getByTestId('task-posted-success-screen')).toBeTruthy();
  });

  it('shows success headline', () => {
    render(<TaskPostedSuccessScreen />);
    expect(screen.getByText('Task Posted!')).toBeTruthy();
  });

  it('shows success body text', () => {
    render(<TaskPostedSuccessScreen />);
    expect(screen.getByText('Taskers in your area will be notified')).toBeTruthy();
  });

  it('shows next steps', () => {
    render(<TaskPostedSuccessScreen />);
    expect(screen.getByText("You'll get applications soon")).toBeTruthy();
    expect(screen.getByText('Review Tasker profiles and ratings')).toBeTruthy();
  });

  it('renders primary CTA', () => {
    render(<TaskPostedSuccessScreen />);
    expect(screen.getByText('View My Tasks')).toBeTruthy();
  });

  it('CTA navigates to task list', () => {
    render(<TaskPostedSuccessScreen />);
    fireEvent.press(screen.getByTestId('task-posted-success-screen-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/(customer)/tasks');
  });
});
