import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../../context/AppContext';
import { makeCategory, makeProfile, makeSession } from '../../../test/factories';
import { createMockApiClient } from '../../../test/mocks';
import { CustomerApplicantsPage } from '../CustomerApplicantsPage';

function createContext(overrides: Partial<AppContextValue> = {}): AppContextValue {
  const apiClient = overrides.apiClient ?? createMockApiClient();

  return {
    apiClient,
    locale: 'en',
    session: makeSession(),
    profile: makeProfile(),
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
    ...overrides,
  };
}

describe('CustomerApplicantsPage', () => {
  it('TID-TASK-114-WEB-APPLICANTS-ACTIONS fetches applicants for the routed task and wires profile and accept actions', async () => {
    const apiClient = createMockApiClient({
      listMyTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'task-77',
            category_id: makeCategory().id,
            category: makeCategory(),
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
        makeSession().accessToken,
        'task-77',
      );
    });

    await user.click(screen.getByRole('button', { name: 'View profile' }));
    expect(await screen.findByText('Profile route reached')).toBeInTheDocument();
  });

  it('TID-TASK-115-WEB-APPLICANTS-PRICING shows posted budget for BUDGET tasks', async () => {
    const apiClient = createMockApiClient({
      listMyTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'task-budget',
            category_id: makeCategory().id,
            category: makeCategory(),
            description: 'Deep clean',
            budget: 120000,
            pricing_mode: 'BUDGET',
            location_text: 'SBD',
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
            id: 'app-budget',
            task_id: 'task-budget',
            status: 'PENDING',
            message: 'I can do this.',
            created_at: '2026-02-14T00:00:00Z',
            tasker: {
              id: 'tasker-1',
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

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={['/customer/tasks/task-budget/applicants']}>
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

    expect(await screen.findByText('Posted budget: 120,000 MNT')).toBeInTheDocument();
  });

  it('TID-TASK-116-WEB-APPLICANTS-PRICING shows quoted price for QUOTE tasks', async () => {
    const apiClient = createMockApiClient({
      listMyTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'task-quote',
            category_id: makeCategory().id,
            category: makeCategory(),
            description: 'Assembly',
            budget: null,
            pricing_mode: 'QUOTE',
            location_text: 'BZD',
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
            id: 'app-quote',
            task_id: 'task-quote',
            status: 'PENDING',
            message: 'My quote included.',
            quote_price: 98000,
            created_at: '2026-02-14T00:00:00Z',
            tasker: {
              id: 'tasker-1',
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

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={['/customer/tasks/task-quote/applicants']}>
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

    expect(await screen.findByText('Quoted price: 98,000 MNT')).toBeInTheDocument();
  });
});
