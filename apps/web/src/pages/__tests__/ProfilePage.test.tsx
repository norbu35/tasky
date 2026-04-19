import '../../lib/i18n';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../context/AppContext';
import { avatarValueToApiPayload, avatarValueToPreviewUrl } from '../../lib/avatarHelpers';
import { makeProfile, makeSession } from '../../test/factories';
import { createMockApiClient } from '../../test/mocks';
import { ProfilePage } from '../ProfilePage';

function renderProfilePage(profileOverrides: Partial<AppContextValue['profile']> = {}) {
  const apiClient = createMockApiClient();

  const contextValue: AppContextValue = {
    apiClient,
    locale: 'en',
    session: makeSession(),
    profile: {
      ...makeProfile(),
      role: 'CUSTOMER',
      status: 'VERIFIED',
      ...profileOverrides,
    },
    profileBusy: false,
    profileError: null,
    setSession: vi.fn(),
    setProfile: vi.fn(),
    setProfileError: vi.fn(),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    loadProfile: vi.fn().mockResolvedValue(undefined),
    updateSessionUser: vi.fn(),
    signOut: vi.fn(),
    trackClientEvent: vi.fn(),
  };

  return render(
    <MemoryRouter>
      <AppContext.Provider value={contextValue}>
        <ProfilePage />
      </AppContext.Provider>
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  it('converts managed avatar keys into local preview URLs', () => {
    expect(avatarValueToPreviewUrl('uploads/avatars/user-1/photo.png')).toBe(
      'https://cdn.tasky.local/uploads/avatars/user-1/photo.png',
    );
  });

  it('converts tasky CDN avatar URLs back into managed keys for API writes', () => {
    expect(
      avatarValueToApiPayload('https://cdn.tasky.local/uploads/avatars/user-1/photo.png'),
    ).toBe('uploads/avatars/user-1/photo.png');
  });

  it('renders the profile page as a named detail region', () => {
    renderProfilePage();

    expect(screen.getByRole('region', { name: 'Your Profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Identity & Avatar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account Verification' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });
});
