import React, { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '../../src/store/appStore';
import { useAuthStore } from '../../src/store/authStore';
import { createTestQueryClient } from '../test-utils/queryClient';

const mockRequestJson = jest.fn();
const mockGetMyProfile = jest.fn();

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

type DevLoginMutation = {
  mutateAsync: (variables: { phone: string; role: 'CUSTOMER' | 'TASKER' }) => Promise<unknown>;
};

let latestMutation: DevLoginMutation | null = null;

function DevLoginHarness() {
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
    useAuthStore.setState({ session: null });
    useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
  });

  it('routes first-time dev logins to onboarding instead of tabs and fetches the real profile', async () => {
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
    expect(mockRouter.replace).toHaveBeenCalledWith('/onboarding');

    queryClient.clear();
  });
});
