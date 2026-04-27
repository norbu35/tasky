import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';
import React, { useEffect } from 'react';

import { useAppStore } from '../../src/store/appStore';
import { useAuthStore } from '../../src/store/authStore';
import { createTestQueryClient } from '../test-utils/queryClient';

const mockRequestJson = jest.fn();
const mockGetMyProfile = jest.fn();
const mockListMyTasks = jest.fn();

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock('expo-router', () => ({
  __esModule: true,
  router: mockRouter,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    mergeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    multiMerge: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../src/lib/mobileApiClient', () => ({
  createMobileApiClient: () => ({
    requestJson: mockRequestJson,
    requestVoid: jest.fn(),
  }),
}));

jest.mock('../../src/features/profile/api', () => ({
  getMyProfile: (...args: unknown[]) => mockGetMyProfile(...args),
}));

jest.mock('../../src/features/tasks/api', () => ({
  listMyTasks: (...args: unknown[]) => mockListMyTasks(...args),
}));

type DevLoginMutation = {
  mutateAsync: (variables: { phone: string; role: 'CUSTOMER' | 'TASKER' }) => Promise<unknown>;
};

let latestMutation: DevLoginMutation | null = null;
const POST_AUTH_MUTATION_TIMEOUT_MS = 10_000;

function DevLoginHarness() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useDevLogin } = require('../../src/features/auth/hooks/useAuth') as {
    useDevLogin: () => DevLoginMutation;
  };
  const mutation = useDevLogin();

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

describe('useDevLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestMutation = null;
    mockRequestJson.mockResolvedValue({
      access_token: 'dev-access-token',
      refresh_token: 'dev-refresh-token',
      user: {
        id: 'customer-1',
        phone: '+97692000001',
        primary_auth: 'PHONE_OTP',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        created_at: '2026-02-14T00:00:00Z',
      },
    });
    mockGetMyProfile.mockResolvedValue({
      id: 'customer-1',
      phone_masked: '+97692****01',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      full_name: 'Test Customer',
      avatar_url: null,
      rating_avg: 4.7,
      completed_tasks: 12,
      is_pro: false,
      created_at: '2026-02-14T00:00:00Z',
    });
    mockListMyTasks.mockResolvedValue({
      data: [
        {
          id: 'task-1',
          description: 'Seed customer task',
          status: 'OPEN',
          scheduled_at: '2026-04-01T10:00:00Z',
        },
      ],
      cursor: { next: null, prev: null },
    });
    useAuthStore.setState({ session: null });
    useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
  });

  it(
    'routes first-time dev logins to onboarding instead of tabs and fetches the real profile',
    async () => {
      const queryClient = createTestQueryClient();

      render(<DevLoginHarness />, { wrapper: createWrapper(queryClient) });

      await waitFor(() => {
        expect(latestMutation).not.toBeNull();
      });

      await act(async () => {
        await latestMutation?.mutateAsync({
          phone: '+97692000001',
          role: 'CUSTOMER',
        });
      });

      expect(mockRequestJson).toHaveBeenCalledWith('/auth/dev/login', {
        method: 'POST',
        body: JSON.stringify({ phone: '+97692000001', role: 'CUSTOMER' }),
      });
      expect(mockGetMyProfile).toHaveBeenCalledWith('dev-access-token');
      expect(useAuthStore.getState().session?.user.role).toBe('CUSTOMER');
      expect(queryClient.getQueryData(['me', 'dev-access-token'])).toEqual(
        expect.objectContaining({ full_name: 'Test Customer' }),
      );
      expect(useAppStore.getState().currentRole).toBe('customer');
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/onboarding');
      });

      queryClient.clear();
    },
    POST_AUTH_MUTATION_TIMEOUT_MS,
  );

  it(
    'TID-AUTH-POST-AUTH-PREFETCH warms the customer task list cache after customer dev login',
    async () => {
      const queryClient = createTestQueryClient();
      useAppStore.setState({ hasSeenOnboarding: true, currentRole: 'customer' });

      render(<DevLoginHarness />, { wrapper: createWrapper(queryClient) });

      await waitFor(() => {
        expect(latestMutation).not.toBeNull();
      });

      await act(async () => {
        await latestMutation?.mutateAsync({
          phone: '+97692000001',
          role: 'CUSTOMER',
        });
      });

      await waitFor(() => {
        expect(mockListMyTasks).toHaveBeenCalledWith('dev-access-token');
      });
      expect(queryClient.getQueryData(['myTasks', 'dev-access-token'])).toEqual(
        expect.objectContaining({
          data: [expect.objectContaining({ id: 'task-1' })],
        }),
      );

      queryClient.clear();
    },
    POST_AUTH_MUTATION_TIMEOUT_MS,
  );
});
