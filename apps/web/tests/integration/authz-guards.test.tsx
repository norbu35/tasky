import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { createMockApiClient } from '../../src/test/mocks';
import { makeProfile, makeSession, makeUser } from '../../src/test/factories';
import type { AuthTokens, Profile } from '../../src/lib/apiClient';

describe('Authorization Guards Integration', () => {
  it('TID-TASK-080-WEB-AUTHORIZATION-GUARDS enforce auth state, role gating, and banned-user UX', async () => {
    const guestApi = createMockApiClient();
    const guestRender = render(<App apiClient={guestApi} initialRoute="/customer/tasks/new" />);

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();

    guestRender.unmount();

    const customerApi = createMockApiClient({
      getMyProfile: vi.fn().mockResolvedValue(makeProfile()),
    });
    const customerRender = render(
      <App apiClient={customerApi} initialRoute="/tasker/tasks" initialSession={makeSession()} />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Tasker role required' }),
    ).toBeInTheDocument();

    customerRender.unmount();

    const bannedProfile: Profile = {
      ...makeProfile(),
      status: 'BANNED',
    };

    const bannedSession: AuthTokens = {
      ...makeSession(),
      user: {
        ...makeUser(),
        status: 'BANNED',
      },
    };

    const bannedApi = createMockApiClient({
      getMyProfile: vi.fn().mockResolvedValue(bannedProfile),
    });

    render(<App apiClient={bannedApi} initialRoute="/profile" initialSession={bannedSession} />);

    expect(await screen.findByRole('heading', { name: 'Account restricted' })).toBeInTheDocument();
  });
});
