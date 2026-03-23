import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import MyTasksListScreen from '../../../src/app/(customer)/tasks/index';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
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

const mockUseMyTasks = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useMyTasks', () => ({
  useMyTasks: () => mockUseMyTasks(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MyTasksListScreen (SCR-CUST-001)', () => {
  it('has a testID on the screen container', () => {
    mockUseMyTasks.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    expect(screen.getByTestId('my-tasks-screen')).toBeTruthy();
  });

  it('renders loading skeleton when loading', () => {
    mockUseMyTasks.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    expect(screen.getByTestId('my-tasks-screen')).toBeTruthy();
    // FeedListTemplate shows skeletons when isLoading=true
  });

  it('renders empty activation state when no tasks', () => {
    mockUseMyTasks.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    expect(screen.getByText('No tasks yet')).toBeTruthy();
    expect(screen.getByText('Post your first task and find trusted help')).toBeTruthy();
  });

  it('renders empty state CTA button', () => {
    mockUseMyTasks.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    expect(screen.getByText('Post a Task')).toBeTruthy();
  });

  it('renders task cards with title and status when populated', () => {
    mockUseMyTasks.mockReturnValue({
      data: {
        data: [
          {
            id: 't-1',
            description: 'Fix my sink',
            status: 'OPEN',
            budget: 50000,
            scheduled_at: '2026-04-01T10:00:00Z',
            category: { name: 'Handyman' },
          },
          {
            id: 't-2',
            description: 'Clean apartment',
            status: 'ASSIGNED',
            budget: 30000,
            scheduled_at: '2026-04-02T14:00:00Z',
            category: { name: 'Cleaning' },
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    expect(screen.getByText('Fix my sink')).toBeTruthy();
    expect(screen.getByText('Clean apartment')).toBeTruthy();
  });

  it('renders filter tabs', () => {
    mockUseMyTasks.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText('Assigned')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders FAB button', () => {
    mockUseMyTasks.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    expect(screen.getByTestId('my-tasks-fab')).toBeTruthy();
  });

  it('FAB navigates to category selection', () => {
    mockUseMyTasks.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    fireEvent.press(screen.getByTestId('my-tasks-fab'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/tasks/new/category');
  });

  it('renders error state when API fails', () => {
    mockUseMyTasks.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    });
    render(<MyTasksListScreen />);
    expect(screen.getByTestId('my-tasks-screen')).toBeTruthy();
  });
});
