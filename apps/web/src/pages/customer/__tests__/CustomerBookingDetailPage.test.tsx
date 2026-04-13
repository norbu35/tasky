import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../../context/AppContext';
import { CustomerBookingDetailPage } from '../CustomerBookingDetailPage';
import { createMockApiClient } from '../../../test/mocks';
import { makeBooking, makeProfile, makeSession } from '../../../test/factories';

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
    updateSessionUser: vi.fn(),
    signOut: vi.fn(),
    trackClientEvent: vi.fn(),
    ...overrides,
  };
}

describe('CustomerBookingDetailPage', () => {
  it('TID-TASK-114-WEB-ROUTE-PARAM-LOAD loads the booking from :bookingId instead of a scaffold fallback', async () => {
    const apiClient = createMockApiClient({
      getBooking: vi.fn().mockResolvedValue({
        ...makeBooking(),
        id: 'booking-99',
        task_id: 'task-99',
      }),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <MemoryRouter initialEntries={['/customer/bookings/booking-99']}>
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider value={createContext({ apiClient })}>
            <Routes>
              <Route path="/customer/bookings/:bookingId" element={<CustomerBookingDetailPage />} />
            </Routes>
          </AppContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Booking detail' })).toBeInTheDocument();
    await waitFor(() => {
      expect(apiClient.getBooking).toHaveBeenCalledWith(makeSession().accessToken, 'booking-99');
    });
    expect(screen.getByText('booking-99')).toBeInTheDocument();
  });
});
