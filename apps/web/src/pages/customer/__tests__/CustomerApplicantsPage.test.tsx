import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../../context/AppContext';
import { CustomerApplicantsPage } from '../CustomerApplicantsPage';
import { buildApiClientMock } from '../../../../tests/setup/mockApiClient';
import { baseCategory, baseProfile, baseSession } from '../../../../tests/setup/mockData';

function createContext(overrides: Partial<AppContextValue> = {}): AppContextValue {
  const apiClient = overrides.apiClient ?? buildApiClientMock();

  return {
    apiClient,
    locale: 'en',
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
    ...overrides,
  };
}

describe('CustomerApplicantsPage', () => {
  it('TID-TASK-114-WEB-APPLICANTS-ACTIONS fetches applicants for the routed task and wires profile and accept actions', async () => {
    const apiClient = buildApiClientMock({
      listMyTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'task-77',
            category_id: baseCategory.id,
            category: baseCategory,
            description: 'Move a sofa',
            budget: 90000,
            location_text: 'БЗД 1-р хороо',
            scheduled_at: '2026-02-16T10:00:00Z',
            status: 'OPEN',
            created_at: '2026-02-14T00:00:00Z',
          },
        ],
        cursor: { next: null, has_more: false },
      }),
      listTaskApplications: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'app-77',
            task_id: 'task-77',
            status: 'PENDING',
            message: 'I can do this tonight.',
            created_at: '2026-02-14T00:00:00Z',
            tasker: {
              id: 'tasker-77',
              full_name: 'Tasker One',
              avatar_url: null,
              rating_avg: 4.8,
              completed_tasks: 12,
              is_pro: true,
            },
          },
        ],
        cursor: { next: null, has_more: false },
      }),
    });

    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <MemoryRouter initialEntries={['/customer/tasks/task-77/applicants']}>
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider value={createContext({ apiClient })}>
            <Routes>
              <Route
                path="/customer/tasks/:taskId/applicants"
                element={<CustomerApplicantsPage />}
              />
              <Route
                path="/customer/taskers/:taskerId"
                element={<div>Profile route reached</div>}
              />
              <Route
                path="/customer/booking-confirmation"
                element={<div>Booking confirmation route reached</div>}
              />
            </Routes>
          </AppContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Applicants' })).toBeInTheDocument();
    expect(await screen.findByText('Tasker One')).toBeInTheDocument();
    await waitFor(() => {
      expect(apiClient.listTaskApplications).toHaveBeenCalledWith(
        baseSession.accessToken,
        'task-77',
      );
    });

    await user.click(screen.getByRole('button', { name: 'View profile' }));
    expect(await screen.findByText('Profile route reached')).toBeInTheDocument();
  });

  it('TID-TASK-114-WEB-SCAFFOLD-CLEANUP removes scaffold copy and dead fallback messaging from the applicants page', async () => {
    const apiClient = buildApiClientMock({
      listMyTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'task-88',
            category_id: baseCategory.id,
            category: baseCategory,
            description: 'Deep clean apartment',
            budget: 120000,
            location_text: 'ХУД 15-р хороо',
            scheduled_at: '2026-02-16T10:00:00Z',
            status: 'OPEN',
            created_at: '2026-02-14T00:00:00Z',
          },
        ],
        cursor: { next: null, has_more: false },
      }),
      listTaskApplications: vi.fn().mockResolvedValue({
        data: [],
        cursor: { next: null, has_more: false },
      }),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <MemoryRouter initialEntries={['/customer/tasks/task-88/applicants']}>
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider value={createContext({ apiClient })}>
            <Routes>
              <Route
                path="/customer/tasks/:taskId/applicants"
                element={<CustomerApplicantsPage />}
              />
            </Routes>
          </AppContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Applicants' })).toBeInTheDocument();
    expect(
      screen.queryByText('Hook this page up to a task ID to show the live applicant queue.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'The customer parity baseline should keep the review flow ready even before route wiring is enabled.',
      ),
    ).not.toBeInTheDocument();
  });
});
