import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';
import React, { useEffect } from 'react';

import type { CursorPage, PublicTask, TaskFeedItem } from '../../src/lib/api/types';
import { useAuthStore } from '../../src/store/authStore';
import { createTestQueryClient } from '../test-utils/queryClient';

const mockRequestJson = jest.fn();
const mockGetCurrentLocation = jest.fn();

jest.mock('../../src/lib/mobileApiClient', () => ({
  createMobileApiClient: () => ({
    requestJson: mockRequestJson,
    requestVoid: jest.fn(),
  }),
}));

jest.mock('../../src/utils/permissions', () => ({
  getCurrentLocation: mockGetCurrentLocation,
}));

jest.mock('../../src/features/profile', () => ({
  useMyProfile: jest.fn(() => ({ data: { status: 'VERIFIED' } })),
}));

type UseTasksResult = ReturnType<typeof import('../../src/features/tasks/hooks/useTasks').useTasks>;
type UseTaskDetailResult = ReturnType<
  typeof import('../../src/features/tasks/hooks/useTasks').useTaskDetail
>;

let latestTasksResult: UseTasksResult | null = null;
let latestTaskDetailResult: UseTaskDetailResult | null = null;

const task = {
  id: 'task-1',
  description: 'Deep clean apartment',
  category: {
    id: 'category-1',
    name: 'Cleaning',
    name_mn: 'Цэвэрлэгээ',
    icon_url: 'https://example.com/icon.png',
  },
  budget: 50000,
  pricing_mode: 'BUDGET',
  approximate_location: 'Bayangol district',
  approximate_lat: 47.91,
  approximate_lng: 106.91,
  status: 'OPEN',
  scheduled_at: '2026-04-01T10:00:00Z',
  created_at: '2026-03-23T00:00:00Z',
} as TaskFeedItem;

const taskDetail = {
  ...task,
  category: {
    ...task.category,
    icon_url: task.category.icon_url ?? '',
    is_active: true,
    sort_order: 1,
    intake_enabled: false,
    assisted_distribution_enabled: false,
    intake_schema_version: 0,
  },
  customer: { id: 'customer-1', full_name: 'Customer', avatar_url: null, rating_avg: 5 },
  photo_urls: [],
  application_count: 0,
} as PublicTask;

function page(tasks: TaskFeedItem[], next: string | null = null): CursorPage<TaskFeedItem> {
  return {
    data: tasks,
    cursor: { next, has_more: next !== null },
  };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function UseTasksHarness() {
  const { useTasks } =
    require('../../src/features/tasks/hooks/useTasks') as typeof import('../../src/features/tasks/hooks/useTasks');
  const result = useTasks();

  useEffect(() => {
    latestTasksResult = result;
  }, [result]);

  return null;
}

function UseTaskDetailHarness() {
  const { useTaskDetail } =
    require('../../src/features/tasks/hooks/useTasks') as typeof import('../../src/features/tasks/hooks/useTasks');
  const result = useTaskDetail('task-1');

  useEffect(() => {
    latestTaskDetailResult = result;
  }, [result]);

  return null;
}

function FeedAndDetailHarness() {
  return (
    <>
      <UseTasksHarness />
      <UseTaskDetailHarness />
    </>
  );
}

describe('useTasks feed query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestTasksResult = null;
    latestTaskDetailResult = null;
    mockGetCurrentLocation.mockReturnValue(new Promise(() => {}));
    useAuthStore.setState({
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'tasker-1',
          phone: '+97692000001',
          primary_auth: 'FACEBOOK',
          role: 'TASKER',
          status: 'VERIFIED',
          created_at: '2026-02-14T00:00:00Z',
        },
      },
    });
  });

  it('TID-TASK-072-MOBILE-FEED-QUERY requests the first feed page without waiting for GPS', async () => {
    const queryClient = createTestQueryClient();
    mockRequestJson.mockResolvedValueOnce(page([]));

    render(<UseTasksHarness />, { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(mockRequestJson).toHaveBeenCalledWith('/tasks', { method: 'GET' }, 'access-token', {
        category: undefined,
        lat: undefined,
        lng: undefined,
        radius_km: undefined,
        cursor: undefined,
        limit: 20,
      });
    });
    expect(mockGetCurrentLocation).not.toHaveBeenCalled();

    queryClient.clear();
  });

  it('TID-TASK-072-MOBILE-FEED-QUERY fetches additional pages with the backend cursor', async () => {
    const queryClient = createTestQueryClient();
    mockRequestJson.mockResolvedValueOnce(page([task], 'cursor-2')).mockResolvedValueOnce(
      page([
        {
          ...task,
          id: 'task-2',
          description: 'Move sofa',
        },
      ]),
    );

    render(<UseTasksHarness />, { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(latestTasksResult?.data?.data).toHaveLength(1);
    });

    await act(async () => {
      await latestTasksResult?.fetchNextPage();
    });

    await waitFor(() => {
      expect(mockRequestJson).toHaveBeenNthCalledWith(
        2,
        '/tasks',
        { method: 'GET' },
        'access-token',
        {
          category: undefined,
          lat: undefined,
          lng: undefined,
          radius_km: undefined,
          cursor: 'cursor-2',
          limit: 20,
        },
      );
      expect(latestTasksResult?.data?.data).toHaveLength(2);
    });

    queryClient.clear();
  });

  it('TID-TASK-072-MOBILE-FEED-QUERY keeps feed and task-detail cache entries separate', async () => {
    const queryClient = createTestQueryClient();
    mockRequestJson.mockResolvedValueOnce(page([])).mockResolvedValueOnce(taskDetail);

    render(<FeedAndDetailHarness />, { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(mockRequestJson).toHaveBeenCalledTimes(2);
      expect(mockRequestJson).toHaveBeenNthCalledWith(
        2,
        '/tasks/task-1',
        { method: 'GET' },
        'access-token',
      );
      expect(latestTasksResult?.data?.data).toHaveLength(0);
      expect(latestTaskDetailResult?.task?.id).toBe('task-1');
    });

    queryClient.clear();
  });
});
