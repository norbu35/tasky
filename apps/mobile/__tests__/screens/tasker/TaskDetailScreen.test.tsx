import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import type { PublicTask } from '../../../src/lib/mobileApiClient';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ id: 'task-123' }),
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

jest.mock('../../../src/features/tasks/hooks/useTasks', () => ({
  useTasks: jest.fn(),
  useTaskDetail: jest.fn(),
}));

jest.mock('../../../src/lib/mobileApiClient', () => ({
  createMobileApiClient: () => ({
    applyToTask: jest.fn().mockResolvedValue({
      id: 'app-1',
      task_id: 'task-123',
      tasker_id: 'tasker-1',
      message: 'I can do this',
      status: 'PENDING',
      created_at: '2026-03-23T00:00:00Z',
    }),
  }),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

jest.mock('../../../src/store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: any) =>
      selector({
        session: {
          accessToken: 'test-token',
          refreshToken: 'ref',
          user: { id: 'u1', phone: '+976', role: 'TASKER', status: 'ACTIVE', created_at: '' },
        },
        profile: {
          id: 'u1',
          phone: '+976',
          role: 'TASKER',
          status: 'ACTIVE',
          full_name: 'Test Tasker',
          avatar_url: null,
          rating_avg: 4.5,
          completed_tasks: 10,
          is_pro: false,
          created_at: '',
        },
      }),
    { getState: () => ({ session: { accessToken: 'test-token' } }), setState: jest.fn() },
  ),
}));

const { useTaskDetail } = require('../../../src/features/tasks/hooks/useTasks');
const mockUseTaskDetail = useTaskDetail as jest.MockedFunction<any>;

const baseTask: PublicTask = {
  id: 'task-123',
  category: {
    id: 'cat-cleaning',
    name: 'Cleaning',
    name_mn: 'Цэвэрлэгээ',
    icon_url: 'https://example/icon.png',
    is_active: true,
    sort_order: 1,
    intake_enabled: false,
    intake_schema_version: 0,
  },
  customer: {
    id: 'customer-1',
    full_name: 'John Customer',
    avatar_url: null,
    rating_avg: 4.5,
  },
  description: 'Deep clean a 3-bedroom apartment',
  budget: 75000,
  approximate_location: 'Bayangol district',
  approximate_lat: 47.91,
  approximate_lng: 106.91,
  status: 'OPEN',
  scheduled_at: '2026-03-25T10:00:00Z',
  photo_urls: ['https://example.com/task-photo-1.jpg', 'https://example.com/task-photo-2.jpg'],
  application_count: 3,
  created_at: '2026-03-23T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TaskDetailScreen (SCR-TASK-002)', () => {
  it('renders task title and description', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    expect(screen.getByText('Deep clean a 3-bedroom apartment')).toBeTruthy();
    expect(screen.getByText('John Customer')).toBeTruthy();
    expect(screen.getByText('Bayangol district')).toBeTruthy();
  });

  it('shows "Apply for Task" button when verified', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    expect(screen.getByText('tasker.taskDetail.applyButton')).toBeTruthy();
  });

  it('shows "Get Verified" when unverified', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: false,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    expect(screen.getByText('tasker.taskDetail.getVerified')).toBeTruthy();
  });

  it('navigates to tasker verification when unverified CTA is pressed', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: false,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    fireEvent.press(screen.getByTestId('task-detail-cta'));
    expect(mockPush).toHaveBeenCalledWith('/(tasker)/verification');
  });

  it('shows "Application Sent" when already applied', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: true,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    expect(screen.getByText('tasker.taskDetail.alreadyApplied')).toBeTruthy();
  });

  it('apply button calls applyToTask and shows success', async () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    fireEvent.press(screen.getByText('tasker.taskDetail.applyButton'));

    await waitFor(() => {
      expect(screen.getByText('tasker.taskDetail.applicationSentTitle')).toBeTruthy();
    });
  });

  it('shows error state with retry', () => {
    mockUseTaskDetail.mockReturnValue({
      task: null,
      isLoading: false,
      isError: true,
      isVerified: false,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    expect(screen.getByTestId('task-detail-error')).toBeTruthy();
  });

  it('back button calls router.back', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    fireEvent.press(screen.getByTestId('task-detail-back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('shows a secondary message button for verified taskers', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    expect(screen.getByText('Message')).toBeTruthy();
  });

  it('renders task photos and approximate location note', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    expect(screen.getByText('Photos')).toBeTruthy();
    expect(screen.getByTestId('task-detail-photos')).toBeTruthy();
    expect(
      screen.getByText('Approximate location (exact address shown after booking confirmed)'),
    ).toBeTruthy();
  });

  it('renders compact trust banner on detail', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    const TaskDetailScreen = require('../../../src/app/task/[id]').default;
    render(<TaskDetailScreen />);

    expect(screen.getByText('Platform trust')).toBeTruthy();
  });
});
