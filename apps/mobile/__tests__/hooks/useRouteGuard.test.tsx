import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useRouteGuard } from '../../src/hooks/useRouteGuard';
import { useAuthStore } from '../../src/store/authStore';
import type { AuthTokens, Profile, User } from '../../src/lib/mobileApiClient';

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
    phone: '+97699001122',
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
    useAuthStore.setState({ session: null, profile: null, deviceToken: null });
});

describe('useRouteGuard', () => {
    it('returns isAuthenticated true when session exists', () => {
        useAuthStore.setState({ session: baseSession, profile: baseProfile });

        render(<GuardConsumer requireAuth />);

        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    it('returns isAuthenticated false when no session', () => {
        render(<GuardConsumer requireAuth />);

        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('redirects to /(auth) when requireAuth and no session', () => {
        render(<GuardConsumer requireAuth />);

        expect(mockReplace).toHaveBeenCalledWith('/(auth)');
    });

    it('redirects to /account/banned when profile status is BANNED', () => {
        useAuthStore.setState({
            session: baseSession,
            profile: { ...baseProfile, status: 'BANNED' },
        });

        render(<GuardConsumer requireAuth />);

        expect(mockReplace).toHaveBeenCalledWith('/account/banned');
    });

    it('redirects to /account/suspended when profile status is SUSPENDED', () => {
        useAuthStore.setState({
            session: baseSession,
            profile: { ...baseProfile, status: 'SUSPENDED' },
        });

        render(<GuardConsumer requireAuth />);

        expect(mockReplace).toHaveBeenCalledWith('/account/suspended');
    });

    it('does not redirect when authenticated and not restricted', () => {
        useAuthStore.setState({ session: baseSession, profile: baseProfile });

        render(<GuardConsumer requireAuth />);

        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does not redirect to auth when requireAuth is false', () => {
        render(<GuardConsumer requireAuth={false} />);

        expect(mockReplace).not.toHaveBeenCalled();
    });
});
