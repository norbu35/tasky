import '../../src/lib/i18n';

import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../src/context/AppContext';
import { buildApiClientMock } from '../setup/mockApiClient';
import { baseProfile, baseSession, baseUser } from '../setup/mockData';
import { TaskerApplicationSentPage } from '../../src/pages/tasker/TaskerApplicationSentPage';
import { TaskerBookingDetailPage } from '../../src/pages/tasker/TaskerBookingDetailPage';
import { TaskerCancelDialog } from '../../src/pages/tasker/TaskerCancelDialog';
import { TaskerFeedPage } from '../../src/pages/TaskerFeedPage';
import { TaskerJobsPage } from '../../src/pages/tasker/TaskerJobsPage';
import { TaskerNoShowDialog } from '../../src/pages/tasker/TaskerNoShowDialog';
import { TaskerProfilePolishPage } from '../../src/pages/tasker/TaskerProfilePolishPage';
import { TaskerPrivacyPage } from '../../src/pages/tasker/TaskerPrivacyPage';
import { TaskerStatsPage } from '../../src/pages/tasker/TaskerStatsPage';
import { TaskerTaskDetailPage } from '../../src/pages/tasker/TaskerTaskDetailPage';
import { TaskerTasksPage } from '../../src/pages/TaskerTasksPage';
import { VerificationApprovedPage } from '../../src/pages/tasker/VerificationApprovedPage';
import { VerificationConsentPage } from '../../src/pages/tasker/VerificationConsentPage';
import { VerificationGatePage } from '../../src/pages/tasker/VerificationGatePage';
import { VerificationPendingPage } from '../../src/pages/tasker/VerificationPendingPage';
import { VerificationRejectedPage } from '../../src/pages/tasker/VerificationRejectedPage';
import { VerificationSubmittedPage } from '../../src/pages/tasker/VerificationSubmittedPage';
import { VerificationUploadPage } from '../../src/pages/tasker/VerificationUploadPage';
import { VerificationPage } from '../../src/pages/VerificationPage';

// The page files above are intentionally direct-component exports for this slice.
// Keep this file as a smoke baseline around the tasker route family.

function createContext(overrides: Partial<AppContextValue> = {}): AppContextValue {
  const apiClient = overrides.apiClient ?? buildApiClientMock();

  return {
    apiClient,
    locale: 'en',
    session: {
      ...baseSession,
      user: {
        ...baseUser,
        role: 'TASKER',
      },
    },
    profile: {
      ...baseProfile,
      role: 'TASKER',
      status: 'VERIFIED',
      full_name: 'Verified Tasker',
    },
    profileBusy: false,
    profileError: null,
    setSession: vi.fn(),
    setProfile: vi.fn(),
    setProfileError: vi.fn(),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    updateSessionUser: vi.fn(),
    signOut: vi.fn(),
    trackClientEvent: vi.fn(),
    ...overrides,
  };
}

function renderWithProviders(ui: ReactElement, apiClient = buildApiClientMock()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={createContext({ apiClient })}>{ui}</AppContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('Tasker phase 1 parity', () => {
  it('renders the tasker feed and application-sent surfaces', async () => {
    const apiClient = buildApiClientMock({
      listTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'public-task-1',
            category: {
              ...baseProfile,
              id: 'cat-cleaning',
              name: 'Cleaning',
              name_mn: 'Цэвэрлэгээ',
            } as never,
            customer: {
              id: 'customer-1',
              full_name: 'Customer',
              avatar_url: null,
              rating_avg: 4.5,
            },
            description: 'Window cleaning',
            budget: 65000,
            approximate_location: 'Сүхбаатар дүүрэг',
            approximate_lat: 47.92,
            approximate_lng: 106.92,
            status: 'OPEN',
            scheduled_at: '2026-02-15T00:00:00Z',
            photo_urls: [],
            application_count: 0,
            created_at: '2026-02-14T00:00:00Z',
          },
        ],
        cursor: { next: null, has_more: false },
      }),
      listCategories: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'cat-cleaning',
            name: 'Cleaning',
            name_mn: 'Цэвэрлэгээ',
            icon_url: 'https://example.test/icon.png',
            is_active: true,
            sort_order: 1,
          },
        ],
        cursor: { next: null, has_more: false },
      }),
      applyToTask: vi.fn().mockResolvedValue({
        id: 'app-1',
        task_id: 'public-task-1',
        tasker: {
          id: 'tasker-1',
          full_name: 'Tasker',
          avatar_url: null,
          rating_avg: 4.6,
          completed_tasks: 7,
          is_pro: true,
        },
        message: 'I can do this task tomorrow morning.',
        status: 'PENDING',
        created_at: '2026-02-14T00:00:00Z',
      }),
    });

    renderWithProviders(<TaskerFeedPage />, apiClient);

    expect(await screen.findByRole('heading', { name: 'Open task feed' })).toBeInTheDocument();
    expect(await screen.findByText('Сүхбаатар дүүрэг')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Application message'), {
      target: { value: 'I can complete this task quickly and safely.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply to task' }));

    await waitFor(() => {
      expect(apiClient.applyToTask).toHaveBeenCalledWith(
        'access-token',
        'public-task-1',
        'I can complete this task quickly and safely.',
      );
    });

    expect(await screen.findByText('Application sent.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Application sent' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to feed' })).toBeInTheDocument();
  });

  it('renders the tasker jobs and verification smoke surfaces', async () => {
    const apiClient = buildApiClientMock({
      listTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'assigned-task-1',
            category_id: 'cat-cleaning',
            description: 'Deep clean apartment',
            budget: 120000,
            location_text: 'Exact location kept private',
            status: 'ASSIGNED',
            scheduled_at: '2026-02-16T10:00:00Z',
            created_at: '2026-02-14T00:00:00Z',
          },
          {
            id: 'completed-task-1',
            category_id: 'cat-cleaning',
            description: 'Move furniture',
            budget: 90000,
            location_text: 'Exact location kept private',
            status: 'COMPLETED',
            scheduled_at: '2026-02-16T10:00:00Z',
            created_at: '2026-02-14T00:00:00Z',
          },
        ],
        cursor: { next: null, has_more: false },
      }),
      getVerificationStatus: vi.fn().mockResolvedValue({
        status: 'APPROVED',
        admin_notes: null,
        submitted_at: '2026-02-14T00:00:00Z',
        reviewed_at: '2026-02-15T00:00:00Z',
      }),
    });

    renderWithProviders(
      <>
        <TaskerTasksPage />
        <VerificationPage />
      </>,
      apiClient,
    );

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Identity Verification' })).toBeInTheDocument();
  });

  it('renders tasker support and profile polish surfaces', () => {
    renderWithProviders(
      <>
        <TaskerTaskDetailPage />
        <TaskerTasksPage />
        <TaskerJobsPage />
        <TaskerBookingDetailPage />
        <TaskerNoShowDialog />
        <TaskerCancelDialog />
        <TaskerStatsPage />
        <TaskerPrivacyPage />
        <TaskerProfilePolishPage />
        <VerificationGatePage />
        <VerificationConsentPage />
        <VerificationUploadPage />
        <VerificationPendingPage />
        <VerificationApprovedPage />
        <VerificationRejectedPage />
        <VerificationSubmittedPage />
        <TaskerApplicationSentPage />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Task detail' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My jobs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Booking detail' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No-show reminder' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cancel booking' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tasker stats' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacy policy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI profile polish' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Identity verification' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verification consent' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upload verification documents' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verification pending' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verification approved' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verification rejected' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verification submitted' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Application sent' })).toBeInTheDocument();
  });
});
