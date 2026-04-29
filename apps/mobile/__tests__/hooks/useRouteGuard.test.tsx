import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useRouteGuard } from '../../src/hooks/useRouteGuard';
import { useAuthStore } from '../../src/store/authStore';
import type { AuthTokens, Profile, User } from '../../src/lib/api/types';
import { createTestQueryClient } from '../test-utils/queryClient';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    push: mockPush,
  }),
}));

const baseUser: User = {
  id: 'user-1',
  phone: '+97699001122',
  primary_auth: 'FACEBOOK',
  role: 'CUSTOMER',
  status: 'PENDING',
  created_at: '2026-02-14T00:00:00Z',
};

const baseSession: AuthTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: baseUser,
};

const baseProfile: Profile = {
  id: 'user-1',
  phone_masked: '+97699****22',
  role: 'CUSTOMER',
  status: 'PENDING',
  full_name: 'Test Customer',
  avatar_url: null,
  rating_avg: 0,
  completed_tasks: 0,
  is_pro: false,
  created_at: '2026-02-14T00:00:00Z',
};

function GuardConsumer({ requireAuth }: { requireAuth?: boolean }) {
  const { isAuthenticated, isRestricted } = useRouteGuard({ requireAuth });
  return (
    <>
      <Text testID="is-authenticated">{String(isAuthenticated)}</Text>
      <Text testID="is-restricted">{String(isRestricted)}</Text>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ session: null });
});

describe('useRouteGuard', () => {
  it('returns isAuthenticated true when session exists', () => {
    const queryClient = createTestQueryClient();
    useAuthStore.setState({ session: baseSession });
    queryClient.setQueryData(['me', baseSession.user.id], baseProfile);

    render(
      <QueryClientProvider client={queryClient}>
        <GuardConsumer requireAuth />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    queryClient.clear();
  });

  it('returns isAuthenticated false when no session', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <GuardConsumer requireAuth />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    queryClient.clear();
  });

  it('redirects to /(auth) when requireAuth and no session', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <GuardConsumer requireAuth />
      </QueryClientProvider>,
    );

    expect(mockReplace).toHaveBeenCalledWith('/(auth)');
    queryClient.clear();
  });

  it('redirects to /account/banned when profile status is BANNED', () => {
    const queryClient = createTestQueryClient();
    useAuthStore.setState({ session: baseSession });
    queryClient.setQueryData(['me', baseSession.user.id], {
      ...baseProfile,
      status: 'BANNED',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GuardConsumer requireAuth />
      </QueryClientProvider>,
    );

    expect(mockReplace).toHaveBeenCalledWith('/account/banned');
    queryClient.clear();
  });

  it('redirects to /account/suspended when profile status is SUSPENDED', () => {
    const queryClient = createTestQueryClient();
    useAuthStore.setState({ session: baseSession });
    queryClient.setQueryData(['me', baseSession.user.id], {
      ...baseProfile,
      status: 'SUSPENDED',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GuardConsumer requireAuth />
      </QueryClientProvider>,
    );

    expect(mockReplace).toHaveBeenCalledWith('/account/suspended');
    queryClient.clear();
  });

  it('does not redirect when authenticated and not restricted', () => {
    const queryClient = createTestQueryClient();
    useAuthStore.setState({ session: baseSession });
    queryClient.setQueryData(['me', baseSession.user.id], baseProfile);

    render(
      <QueryClientProvider client={queryClient}>
        <GuardConsumer requireAuth />
      </QueryClientProvider>,
    );

    expect(mockReplace).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it('does not redirect to auth when requireAuth is false', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <GuardConsumer requireAuth={false} />
      </QueryClientProvider>,
    );

    expect(mockReplace).not.toHaveBeenCalled();
    queryClient.clear();
  });
});
