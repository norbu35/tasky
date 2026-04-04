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

    expect(screen.getByTestId('SCR-TASK-016')).toBeTruthy();
  });

  it('renders stats cards with jobs completed, rating, response time, reliability', () => {
    mockUseMyStats.mockReturnValue({
      data: {
        jobs_completed: 23,
        average_rating: 4.7,
        response_time_minutes: 12,
        reliability_score: 96,
        completion_rate: 94,
        application_success_rate: 42,
        unlock_conversion_rate: 18,
        cancellations_30d: 1,
        rating_breakdown: {
          task_clarity: 4.8,
          respectfulness: 4.9,
          punctuality: 4.6,
        },
        is_pro: true,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const StatsScreen = require('../../../../src/app/(tasker)/stats').default;
    render(<StatsScreen />);

    expect(screen.getByText('23')).toBeTruthy();
    expect(screen.getAllByText('4.7').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/12 мин/)).toBeTruthy();
    expect(screen.getByText('96%')).toBeTruthy();
    expect(screen.getByText('94%')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('42%')).toBeTruthy();
  });

  it('renders the hero rating panel', () => {
    mockUseMyStats.mockReturnValue({
      data: {
        jobs_completed: 23,
        average_rating: 4.8,
        response_time_minutes: 12,
        reliability_score: 96,
        completion_rate: 94,
        cancellations_30d: 1,
        rating_breakdown: {
          task_clarity: 4.8,
          respectfulness: 4.9,
          punctuality: 4.6,
        },
        is_pro: true,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const StatsScreen = require('../../../../src/app/(tasker)/stats').default;
    render(<StatsScreen />);

    expect(screen.getByTestId('tasker-stats-hero')).toBeTruthy();
    expect(screen.getByText('Таны үнэлгээ')).toBeTruthy();
    expect(screen.getByText('Захиалагчийн үнэлгээнээс')).toBeTruthy();
  });

  it('renders stat labels', () => {
    mockUseMyStats.mockReturnValue({
      data: {
        jobs_completed: 23,
        average_rating: 4.7,
        response_time_minutes: 12,
        reliability_score: 96,
        completion_rate: 94,
        application_success_rate: 42,
        unlock_conversion_rate: 18,
        cancellations_30d: 1,
        rating_breakdown: {
          task_clarity: 4.8,
          respectfulness: 4.9,
          punctuality: 4.6,
        },
        is_pro: true,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const StatsScreen = require('../../../../src/app/(tasker)/stats').default;
    render(<StatsScreen />);

    expect(screen.getByText('Дууссан ажил')).toBeTruthy();
    expect(screen.getByText('Ерөнхий үнэлгээ')).toBeTruthy();
    expect(screen.getByText('Гүйцэтгэлийн хувь')).toBeTruthy();
    expect(screen.getByText('Анкетын амжилт')).toBeTruthy();
    expect(screen.getByText('Цуцлалт (30 хоногт)')).toBeTruthy();
    expect(screen.getByText('Үнэлгээний задаргаа')).toBeTruthy();
    expect(screen.getByText(/Даалгаврын тодорхой байдал/)).toBeTruthy();
    expect(screen.getByText(/Хүндэтгэлтэй хандлага/)).toBeTruthy();
    expect(screen.getByText(/Цаг баримтлал/)).toBeTruthy();
    expect(screen.getByText('Найдвартай байдал')).toBeTruthy();
    expect(screen.getByText('Pro Badge олдсон!')).toBeTruthy();
    expect(screen.getByText('Идэвхжил')).toBeTruthy();
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

    expect(screen.getByTestId('SCR-TASK-016-error')).toBeTruthy();
  });
});
