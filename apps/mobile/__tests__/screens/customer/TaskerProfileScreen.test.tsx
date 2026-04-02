import React from 'react';
import { render, screen } from '@testing-library/react-native';

import TaskerProfileScreen from '../../../src/app/(customer)/taskers/[taskerId]';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ taskerId: 'tasker-1' }),
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

const mockUseTaskerProfile = jest.fn();
jest.mock('../../../src/features/profile/hooks/useTaskerProfile', () => ({
  useTaskerProfile: () => mockUseTaskerProfile(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const makeProfile = (overrides: Record<string, any> = {}) => ({
  id: 'tasker-1',
  full_name: 'Bold Bat',
  avatar_url: 'https://example.com/avatar.jpg',
  rating_avg: 4.7,
  completed_tasks: 24,
  is_pro: true,
  bio: 'Experienced handyman',
  categories: ['Handyman', 'Moving'],
  created_at: '2025-01-15T00:00:00Z',
  ...overrides,
});

const makeReview = (overrides: Record<string, any> = {}) => ({
  id: 'review-1',
  quality_rating: 5,
  comment: 'Great work!',
  created_at: '2026-03-01T00:00:00Z',
  reviewer: { full_name: 'Customer A' },
  ...overrides,
});

describe('TaskerProfileScreen (SCR-CUST-013)', () => {
  it('has a testID on the screen container', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: makeProfile(), isLoading: false, isError: false },
      reviews: { data: { data: [] }, isLoading: false, isError: false },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByTestId('tasker-profile-screen')).toBeTruthy();
  });

  it('renders loading state', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: null, isLoading: true, isError: false },
      reviews: { data: null, isLoading: true, isError: false },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByTestId('tasker-profile-screen')).toBeTruthy();
  });

  it('renders error state', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: null, isLoading: false, isError: true, refetch: jest.fn() },
      reviews: { data: null, isLoading: false, isError: true },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByTestId('tasker-profile-screen-error')).toBeTruthy();
  });

  it('renders tasker name and avatar', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: makeProfile(), isLoading: false, isError: false },
      reviews: { data: { data: [] }, isLoading: false, isError: false },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByText('Bold Bat')).toBeTruthy();
  });

  it('shows verified badge for verified taskers', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: makeProfile({ is_pro: true }), isLoading: false, isError: false },
      reviews: { data: { data: [] }, isLoading: false, isError: false },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByText('Identity Verified')).toBeTruthy();
  });

  it('shows stats: jobs completed and rating', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: makeProfile(), isLoading: false, isError: false },
      reviews: { data: { data: [] }, isLoading: false, isError: false },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByText('Jobs Completed')).toBeTruthy();
    expect(screen.getByText('24')).toBeTruthy();
    expect(screen.getByText('Rating')).toBeTruthy();
    expect(screen.getAllByText('4.7').length).toBeGreaterThanOrEqual(1);
  });

  it('shows reviews list', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: makeProfile(), isLoading: false, isError: false },
      reviews: {
        data: {
          data: [
            makeReview(),
            makeReview({
              id: 'review-2',
              comment: 'Very reliable',
              reviewer: { full_name: 'Customer B' },
            }),
          ],
        },
        isLoading: false,
        isError: false,
      },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByText('Great work!')).toBeTruthy();
    expect(screen.getByText('Very reliable')).toBeTruthy();
  });

  it('shows "No reviews yet" when reviews are empty', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: makeProfile(), isLoading: false, isError: false },
      reviews: { data: { data: [] }, isLoading: false, isError: false },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByText('No reviews yet')).toBeTruthy();
  });

  it('shows Reviews section title', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: makeProfile(), isLoading: false, isError: false },
      reviews: { data: { data: [] }, isLoading: false, isError: false },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByText('Reviews')).toBeTruthy();
  });

  it('shows categories and message CTA copy', () => {
    mockUseTaskerProfile.mockReturnValue({
      profile: { data: makeProfile(), isLoading: false, isError: false },
      reviews: { data: { data: [] }, isLoading: false, isError: false },
    });
    render(<TaskerProfileScreen />);
    expect(screen.getByText('Categories')).toBeTruthy();
    expect(screen.getByText('Handyman')).toBeTruthy();
    expect(screen.getByText('Moving')).toBeTruthy();
    expect(screen.getByText('Message')).toBeTruthy();
  });
});
