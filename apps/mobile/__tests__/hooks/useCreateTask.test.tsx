import React, { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { createTestQueryClient } from '../test-utils/queryClient';

const mockRequestJson = jest.fn();

jest.mock('../../src/lib/mobileApiClient', () => ({
  createMobileApiClient: () => ({
    requestJson: mockRequestJson,
    requestVoid: jest.fn(),
  }),
}));

type CreateTaskMutation = {
  mutateAsync: (variables: Record<string, unknown>) => Promise<unknown>;
};

let latestMutation: CreateTaskMutation | null = null;

function CreateTaskHarness() {
  const { useCreateTask } = require('../../src/features/tasks/hooks/useCreateTask') as {
    useCreateTask: () => CreateTaskMutation;
  };
  const mutation = useCreateTask();

  useEffect(() => {
    latestMutation = mutation;
  }, [mutation]);

  return null;
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCreateTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestMutation = null;
    mockRequestJson.mockResolvedValue({ id: 'task-1' });
    useAuthStore.setState({
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'customer-1',
          phone: '+97692000001',
          primary_auth: 'FACEBOOK',
          role: 'CUSTOMER',
          status: 'VERIFIED',
          created_at: '2026-02-14T00:00:00Z',
        },
      },
    });
  });

  it('invalidates myTasks after a successful task creation', async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    render(<CreateTaskHarness />, { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(latestMutation).not.toBeNull();
    });

    await act(async () => {
      await latestMutation?.mutateAsync({
        category_id: 'cat-123',
        description: 'Fix my sink',
        budget: 50000,
        intake_answers: { property_type: 'apartment' },
        intake_schema_version: 7,
        location_lat: 47.92123,
        location_lng: 106.91876,
        location_text: 'Behind State Dept Store',
        scheduled_at: '2026-04-01T10:00:00Z',
        photo_keys: [],
      });
    });

    expect(mockRequestJson).toHaveBeenCalledWith(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          category_id: 'cat-123',
          description: 'Fix my sink',
          budget: 50000,
          intake_answers: { property_type: 'apartment' },
          intake_schema_version: 7,
          location_lat: 47.92123,
          location_lng: 106.91876,
          location_text: 'Behind State Dept Store',
          scheduled_at: '2026-04-01T10:00:00Z',
          photo_keys: [],
        }),
      },
      'access-token',
    );
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['myTasks'] });

    queryClient.clear();
  });
});
