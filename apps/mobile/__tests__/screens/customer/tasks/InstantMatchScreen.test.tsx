import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

let mockParams: Record<string, string> = {
  taskId: 'task-1',
  taskTitle: 'Deep clean apartment',
  budget: '45000',
  locationText: '15th khoroo',
};
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      return typeof fallback === 'string' ? fallback : key;
    },
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
  mockParams = {
    taskId: 'task-1',
    taskTitle: 'Deep clean apartment',
    budget: '45000',
    locationText: '15th khoroo',
  };
});

describe('CustomerInstantMatchScreen (SCR-CUST-027)', () => {
  it('renders the search hero with rings and task summary while matching', () => {
    const CustomerInstantMatchScreen =
      require('../../../../src/app/(customer)/tasks/[taskId]/instant-match').default;
    render(<CustomerInstantMatchScreen />);

    expect(screen.getByText('Finding your tasker')).toBeTruthy();
    expect(screen.getByText('We are checking nearby verified taskers right now.')).toBeTruthy();
    expect(screen.getByTestId('instant-match-rings')).toBeTruthy();
    expect(screen.getByTestId('instant-match-task-card')).toBeTruthy();
    expect(screen.getByText('Deep clean apartment')).toBeTruthy();
    expect(screen.getByText('₮45,000')).toBeTruthy();
  });

  it('shows matched tasker state with confirm CTA', () => {
    mockParams = {
      ...mockParams,
      state: 'matched_awaiting_accept',
    };
    const CustomerInstantMatchScreen =
      require('../../../../src/app/(customer)/tasks/[taskId]/instant-match').default;
    render(<CustomerInstantMatchScreen />);

    expect(screen.getAllByText('Tasker found').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Verified Tasker')).toBeTruthy();
    expect(screen.getByTestId('instant-match-confirm-booking')).toBeTruthy();
  });

  it('shows fallback state after repeated declines', () => {
    mockParams = {
      ...mockParams,
      state: 'fallback_to_open',
      declineCount: '3',
    };
    const CustomerInstantMatchScreen =
      require('../../../../src/app/(customer)/tasks/[taskId]/instant-match').default;
    render(<CustomerInstantMatchScreen />);

    expect(screen.getAllByText('Instant match could not secure a tasker.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Your task is now open for applications.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('instant-match-view-applicants')).toBeTruthy();
  });

  it('returns to task detail from the error state', () => {
    mockParams = {
      ...mockParams,
      state: 'error_no_eligible',
    };
    const CustomerInstantMatchScreen =
      require('../../../../src/app/(customer)/tasks/[taskId]/instant-match').default;
    render(<CustomerInstantMatchScreen />);

    fireEvent.press(screen.getByTestId('instant-match-back-to-task'));
    expect(mockReplace).toHaveBeenCalledWith('/(customer)/tasks/task-1');
  });
});
