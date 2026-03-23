import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import ApplicantsListScreen from '../../../src/app/(customer)/tasks/[taskId]/applicants';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ taskId: 'task-1' }),
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

const mockUseApplications = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useApplications', () => ({
  useApplications: () => mockUseApplications(),
}));

const mockAcceptMutateAsync = jest.fn();
jest.mock('../../../src/features/bookings/hooks/useAcceptApplication', () => ({
  useAcceptApplication: () => ({
    mutateAsync: mockAcceptMutateAsync,
    isPending: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const makeApplicant = (overrides: Record<string, any> = {}) => ({
  id: 'app-1',
  task_id: 'task-1',
  tasker_id: 'tasker-1',
  message: 'I can help with this',
  tasker: {
    id: 'tasker-1',
    full_name: 'Bold Bat',
    avatar_url: null,
    rating_avg: 4.5,
    completed_tasks: 12,
    is_pro: true,
  },
  ...overrides,
});

describe('ApplicantsListScreen (SCR-CUST-011)', () => {
  it('has a testID on the screen container', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByTestId('applicants-list-screen')).toBeTruthy();
  });

  it('renders loading state', () => {
    mockUseApplications.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByTestId('applicants-list-screen')).toBeTruthy();
  });

  it('renders empty state when no applicants', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('No applicants yet')).toBeTruthy();
    expect(screen.getByText('Taskers are being notified')).toBeTruthy();
  });

  it('renders applicant cards with name and rating', () => {
    mockUseApplications.mockReturnValue({
      data: {
        data: [
          makeApplicant(),
          makeApplicant({
            id: 'app-2',
            tasker_id: 'tasker-2',
            tasker: {
              id: 'tasker-2',
              full_name: 'Sarnai D',
              avatar_url: null,
              rating_avg: 4.8,
              completed_tasks: 20,
              is_pro: true,
            },
          }),
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('Bold Bat')).toBeTruthy();
    expect(screen.getByText('Sarnai D')).toBeTruthy();
  });

  it('renders Accept buttons for each applicant', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('Accept')).toBeTruthy();
  });

  it('renders View Profile buttons', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('View Profile')).toBeTruthy();
  });

  it('View Profile navigates to tasker profile', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    fireEvent.press(screen.getByText('View Profile'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/taskers/tasker-1');
  });

  it('Accept navigates to booking confirmation with params', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    fireEvent.press(screen.getByText('Accept'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/bookings/confirm',
      params: {
        taskId: 'task-1',
        applicationId: 'app-1',
        taskerId: 'tasker-1',
      },
    });
  });

  it('shows verified badge for verified taskers', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByTestId('verified-badge-tasker-1')).toBeTruthy();
  });
});
