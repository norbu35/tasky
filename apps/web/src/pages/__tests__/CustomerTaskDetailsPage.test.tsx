import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../context/AppContext';
import { CustomerTaskDetailsPage } from '../CustomerTaskDetailsPage';
import { buildApiClientMock } from '../../../tests/setup/mockApiClient';
import { baseCategory, baseProfile, baseSession } from '../../../tests/setup/mockData';

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

describe('CustomerTaskDetailsPage', () => {
  it('TID-TASK-114-WEB-ROUTE-PARAM-LOAD loads the routed task and its applicants from :taskId', async () => {
    const apiClient = buildApiClientMock({
      listMyTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'task-99',
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
        cursor: { next: null, prev: null },
      }),
      listTaskApplications: vi.fn().mockResolvedValue({
        data: [],
        cursor: { next: null, prev: null },
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

    expect(await screen.findByRole('heading', { name: 'Deep clean apartment' })).toBeInTheDocument();
    await waitFor(() => {
      expect(apiClient.listTaskApplications).toHaveBeenCalledWith(
        baseSession.accessToken,
        'task-99',
      );
    });
  });
});
