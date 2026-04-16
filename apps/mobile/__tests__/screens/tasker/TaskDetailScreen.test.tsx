import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';
import type { PublicTask } from '../../../src/lib/mobileApiClient';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ id: 'task-123' }),
  Stack: { Screen: () => null },
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

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
  resetTestI18n();
  setTestLanguage('mn');
});

describe('TaskDetailScreen (SCR-TASK-002)', () => {
  it('renders the direct task detail shell with the expected header and testIDs', () => {
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

    expect(screen.getByTestId('SCR-TASK-002')).toBeTruthy();
    expect(screen.getByTestId('SCR-TASK-002-cta')).toBeTruthy();
  });

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

  it('shows the apply button when verified', () => {
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

    expect(screen.getByText('Ажилд өргөдөл гаргах')).toBeTruthy();
  });

  it('shows the verification CTA when unverified', () => {
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

    expect(screen.getByText('Өргөдөл гаргахын тулд баталгаажна уу')).toBeTruthy();
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

    fireEvent.press(screen.getByTestId('SCR-TASK-002-cta'));
    expect(mockPush).toHaveBeenCalledWith('/(tasker)/verification');
  });

  it('shows the already-applied state when the tasker has applied', () => {
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

    expect(screen.getByText('Өргөдөл илгээгдлээ')).toBeTruthy();
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

    fireEvent.press(screen.getByText('Ажилд өргөдөл гаргах'));

    await waitFor(() => {
      expect(screen.getByText('Өргөдөл илгээгдлээ!')).toBeTruthy();
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

    expect(screen.getByTestId('SCR-TASK-002-error')).toBeTruthy();
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

    expect(screen.getByText('Зурвас илгээх')).toBeTruthy();
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

    expect(screen.getByText('Зурагнууд')).toBeTruthy();
    expect(screen.getByTestId('task-detail-photos')).toBeTruthy();
    expect(
      screen.getByText(
        'Ойролцоогоор байршил (захиалгыг баталгаажуулсны дараа яг хаягийг харуулна)',
      ),
    ).toBeTruthy();
  });
});
