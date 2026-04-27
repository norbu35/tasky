import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import type { TextProps } from 'react-native';

import TaskDetailRoute from '../../../src/app/task/[id]';
import { useTaskDetail } from '../../../src/features/tasks/hooks/useTasks';
import type { PublicTask } from '../../../src/lib/api/types';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRequestJson = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ id: 'task-123' }),
  Stack: { Screen: () => null },
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = jest.requireActual(
    '../../test-utils/mockI18n',
  ) as typeof import('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
  const { Text: MockText } = jest.requireActual('react-native') as typeof import('react-native');

  return new Proxy(
    {},
    {
      get: (_target: unknown, name: string) =>
        function MockIcon(props: TextProps) {
          return <MockText testID={`icon-${String(name)}`} {...props} />;
        },
    },
  );
});

jest.mock('../../../src/features/tasks/hooks/useTasks', () => ({
  useTasks: jest.fn(),
  useTaskDetail: jest.fn(),
}));

jest.mock('../../../src/lib/mobileApiClient', () => ({
  createMobileApiClient: () => ({
    requestJson: mockRequestJson,
    requestVoid: jest.fn(),
  }),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

type AuthStoreState = {
  session: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      phone: string;
      role: string;
      status: string;
      created_at: string;
    };
  };
  profile: {
    id: string;
    phone: string;
    role: string;
    status: string;
    full_name: string;
    avatar_url: string | null;
    rating_avg: number;
    completed_tasks: number;
    is_pro: boolean;
    created_at: string;
  };
};

type AuthSelector = (state: AuthStoreState) => unknown;

jest.mock('../../../src/store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: AuthSelector) =>
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

const mockUseTaskDetail = useTaskDetail as jest.MockedFunction<(taskId: string) => unknown>;

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
    assisted_distribution_enabled: false,
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
  pricing_mode: 'BUDGET',
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
  mockRequestJson.mockResolvedValue({
    id: 'app-1',
    task_id: 'task-123',
    tasker_id: 'tasker-1',
    message: 'I can do this',
    quote_price: null,
    status: 'PENDING',
    created_at: '2026-03-23T00:00:00Z',
  });
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

    render(<TaskDetailRoute />);

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

    render(<TaskDetailRoute />);

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

    render(<TaskDetailRoute />);

    expect(screen.getByText('Ажилд өргөдөл гаргах')).toBeTruthy();
  });

  it('notifies the tasker when the task is their own posted task', () => {
    mockUseTaskDetail.mockReturnValue({
      task: {
        ...baseTask,
        customer: {
          ...baseTask.customer,
          id: 'u1',
        },
      },
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    render(<TaskDetailRoute />);

    expect(
      screen.getByText(
        'Энэ таны нийтэлсэн даалгавар. Өргөдөл гаргагчдыг удирдах бол Захиалагч горим руу буцна уу.',
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId('application-form')).toBeNull();
    expect(screen.getByText('Таны даалгавар')).toBeTruthy();
    expect(screen.getByTestId('SCR-TASK-002-cta')).toBeDisabled();
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

    render(<TaskDetailRoute />);

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

    render(<TaskDetailRoute />);

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

    render(<TaskDetailRoute />);

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

    render(<TaskDetailRoute />);

    fireEvent.changeText(screen.getByTestId('application-note-input'), 'I can do this carefully.');
    fireEvent.press(screen.getByText('Ажилд өргөдөл гаргах'));

    await waitFor(() => {
      expect(screen.getByText('Өргөдөл илгээгдлээ!')).toBeTruthy();
    });
    expect(mockRequestJson).toHaveBeenCalledWith(
      '/tasks/task-123/applications',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'I can do this carefully.' }),
      }),
      'test-token',
    );
  });

  it('notifies the tasker when application submission fails', async () => {
    mockRequestJson.mockRejectedValueOnce(new Error('Forbidden'));
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    render(<TaskDetailRoute />);

    fireEvent.changeText(screen.getByTestId('application-note-input'), 'I can do this carefully.');
    fireEvent.press(screen.getByText('Ажилд өргөдөл гаргах'));

    await waitFor(() => {
      expect(screen.getByText('Өргөдөл илгээж чадсангүй. Дахин оролдоно уу.')).toBeTruthy();
    });
    expect(screen.queryByText('Өргөдөл илгээгдлээ!')).toBeNull();
  });

  it('SCN-TASK-046: quote mode requires a tasker price quote in the application', async () => {
    mockUseTaskDetail.mockReturnValue({
      task: {
        ...baseTask,
        pricing_mode: 'QUOTE',
        budget: null,
      },
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    render(<TaskDetailRoute />);

    expect(screen.getByText('Захиалагч үнийн санал хүсэж байна')).toBeTruthy();
    expect(screen.getByTestId('application-quote-input')).toBeTruthy();
    expect(screen.getByTestId('SCR-TASK-002-cta')).toBeDisabled();

    fireEvent.changeText(screen.getByTestId('application-note-input'), 'I can bring supplies.');
    fireEvent.changeText(screen.getByTestId('application-quote-input'), '90000');
    fireEvent.press(screen.getByTestId('SCR-TASK-002-cta'));

    await waitFor(() => {
      expect(screen.getByText('Өргөдөл илгээгдлээ!')).toBeTruthy();
    });
    expect(mockRequestJson).toHaveBeenCalledWith(
      '/tasks/task-123/applications',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'I can bring supplies.', quote_price: 90000 }),
      }),
      'test-token',
    );
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

    render(<TaskDetailRoute />);

    expect(screen.getByTestId('SCR-TASK-002-error')).toBeTruthy();
  });

  it('SCN-MSG-005: does not show pre-booking message CTA for verified taskers', () => {
    mockUseTaskDetail.mockReturnValue({
      task: baseTask,
      isLoading: false,
      isError: false,
      isVerified: true,
      hasApplied: false,
      capReached: false,
    });

    render(<TaskDetailRoute />);

    expect(screen.queryByText('Зурвас илгээх')).toBeNull();
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

    render(<TaskDetailRoute />);

    expect(screen.getByText('Зурагнууд')).toBeTruthy();
    expect(screen.getByTestId('task-detail-photos')).toBeTruthy();
    expect(
      screen.getByText(
        'Ойролцоогоор байршил (захиалгыг баталгаажуулсны дараа яг хаягийг харуулна)',
      ),
    ).toBeTruthy();
  });
});
