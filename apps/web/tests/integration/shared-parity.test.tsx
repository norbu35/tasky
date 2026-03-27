import '../../src/lib/i18n';

import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../src/context/AppContext';
import { buildApiClientMock } from '../setup/mockApiClient';
import { baseProfile, baseSession } from '../setup/mockData';
import { InboxPage } from '../../src/pages/shared/InboxPage';
import { ChatDetailPage } from '../../src/pages/shared/ChatDetailPage';
import { NotificationsPage } from '../../src/pages/shared/NotificationsPage';
import { EditProfilePage } from '../../src/pages/shared/EditProfilePage';
import { SettingsPage } from '../../src/pages/shared/SettingsPage';
import { DeleteAccountPage } from '../../src/pages/shared/DeleteAccountPage';
import { ReviewPage } from '../../src/pages/shared/ReviewPage';
import { ReviewReminderDialog } from '../../src/pages/shared/ReviewReminderDialog';
import { ReviewHardLockPage } from '../../src/pages/shared/ReviewHardLockPage';
import { SuspendedPage } from '../../src/pages/shared/SuspendedPage';
import { BannedPage } from '../../src/pages/shared/BannedPage';
import { NetworkErrorPage } from '../../src/pages/shared/NetworkErrorPage';
import { SessionExpiredPage } from '../../src/pages/shared/SessionExpiredPage';
import { AppUpdatePage } from '../../src/pages/shared/AppUpdatePage';
import { HelpPage } from '../../src/pages/shared/HelpPage';
import { TermsPage } from '../../src/pages/shared/TermsPage';
import { PrivacyPage } from '../../src/pages/shared/PrivacyPage';

function renderWithAppContext(ui: ReactNode) {
  const apiClient = buildApiClientMock();
  const contextValue: AppContextValue = {
    apiClient,
    locale: 'en-US',
    session: baseSession,
    profile: baseProfile,
    profileBusy: false,
    profileError: null,
    setSession: vi.fn(),
    setProfile: vi.fn(),
    setProfileError: vi.fn(),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    updateSessionUser: vi.fn(),
    signOut: vi.fn(),
    trackClientEvent: vi.fn(),
  };

  return render(
    <MemoryRouter>
      <AppContext.Provider value={contextValue}>{ui}</AppContext.Provider>
    </MemoryRouter>,
  );
}

describe('Shared parity pages', () => {
  it('renders inbox and chat detail states', () => {
    renderWithAppContext(
      <>
        <InboxPage />
        <ChatDetailPage />
      </>,
    );
    screen.debug();

    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search conversations')).toBeInTheDocument();
    expect(screen.getByText('Apartment cleaning')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Conversation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });

  it('renders notifications, profile settings, and delete account flows', () => {
    renderWithAppContext(
      <>
        <NotificationsPage />
        <EditProfilePage />
        <SettingsPage />
        <DeleteAccountPage />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Logout' })[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete permanently' })).toBeDisabled();
  });

  it('renders review and account-state pages', () => {
    renderWithAppContext(
      <>
        <ReviewPage />
        <ReviewHardLockPage />
        <SuspendedPage />
        <BannedPage />
        <NetworkErrorPage />
        <SessionExpiredPage />
        <AppUpdatePage />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Leave a review' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Review prior booking' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account suspended' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account banned' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Connectivity issues' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Session expired' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Update required' })).toBeInTheDocument();
  });

  it('renders the reminder dialog', () => {
    renderWithAppContext(
      <>
        <ReviewReminderDialog open onOpenChange={vi.fn()} />
      </>,
    );

    expect(screen.getByRole('dialog', { name: "Don't forget to review" })).toBeInTheDocument();
  });

  it('renders help, terms, and privacy surfaces', () => {
    renderWithAppContext(
      <>
        <HelpPage />
        <TermsPage />
        <PrivacyPage />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Help center' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Terms of service' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacy policy' })).toBeInTheDocument();
  });

  it('updates inline state on the review page', () => {
    renderWithAppContext(<ReviewPage />);

    fireEvent.click(screen.getByRole('button', { name: '4 stars' }));
    fireEvent.change(screen.getByLabelText('Review notes'), {
      target: { value: 'Solid work and on time.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));

    expect(screen.getByText('Thanks for submitting feedback.')).toBeInTheDocument();
  });
});
