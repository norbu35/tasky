import React from 'react';
import { render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({}),
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

jest.mock('../../../../src/features/profile/hooks/useMyStats', () => ({
  useMyStats: jest.fn(),
}));

const { useMyStats } = require('../../../../src/features/profile/hooks/useMyStats');
const mockUseMyStats = useMyStats as jest.MockedFunction<any>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TaskerStatsScreen (SCR-TASK-016)', () => {
  it('renders loading skeleton when isLoading is true', () => {
    mockUseMyStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });

    const StatsScreen = require('../../../../src/app/(tasker)/stats').default;
    render(<StatsScreen />);

    expect(screen.getByTestId('tasker-stats')).toBeTruthy();
  });

  it('renders stats cards with jobs completed, rating, response time, reliability', () => {
    mockUseMyStats.mockReturnValue({
      data: {
        jobs_completed: 23,
        average_rating: 4.7,
        response_time_minutes: 12,
        reliability_score: 96,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const StatsScreen = require('../../../../src/app/(tasker)/stats').default;
    render(<StatsScreen />);

    expect(screen.getByText('23')).toBeTruthy();
    expect(screen.getByText('4.7')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('96%')).toBeTruthy();
  });

  it('renders stat labels', () => {
    mockUseMyStats.mockReturnValue({
      data: {
        jobs_completed: 23,
        average_rating: 4.7,
        response_time_minutes: 12,
        reliability_score: 96,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const StatsScreen = require('../../../../src/app/(tasker)/stats').default;
    render(<StatsScreen />);

    expect(screen.getByText('Completed Jobs')).toBeTruthy();
    expect(screen.getByText('Overall Rating')).toBeTruthy();
    expect(screen.getByText('Response Time')).toBeTruthy();
    expect(screen.getByText('Reliability Score')).toBeTruthy();
  });

  it('shows error state with retry', () => {
    mockUseMyStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    });

    const StatsScreen = require('../../../../src/app/(tasker)/stats').default;
    render(<StatsScreen />);

    expect(screen.getByTestId('tasker-stats-error')).toBeTruthy();
  });
});
