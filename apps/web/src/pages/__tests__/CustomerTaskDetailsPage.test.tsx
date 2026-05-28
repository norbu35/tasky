import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../context/AppContext';
import { makeCategory, makeProfile, makeSession } from '../../test/factories';
import { createMockApiClient } from '../../test/mocks';
import { CustomerTaskDetailsPage } from '../CustomerTaskDetailsPage';

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

describe('CustomerTaskDetailsPage', () => {
  it('TID-TASK-114-WEB-ROUTE-PARAM-LOAD loads the routed task and its applicants from :taskId', async () => {
    const apiClient = createMockApiClient({
      listMyTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'task-99',
            category_id: makeCategory().id,
            category: makeCategory(),
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
      <MemoryRouter initialEntries={['/customer/tasks/task-99']}>
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider value={createContext({ apiClient })}>
            <Routes>
              <Route path="/customer/tasks/:taskId" element={<CustomerTaskDetailsPage />} />
            </Routes>
          </AppContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Cleaning' })).toBeInTheDocument();
    expect(screen.getByText('Deep clean apartment')).toBeInTheDocument();
    await waitFor(() => {
      expect(apiClient.listTaskApplications).toHaveBeenCalledWith(
        makeSession().accessToken,
        'task-99',
      );
    });
  });
});
