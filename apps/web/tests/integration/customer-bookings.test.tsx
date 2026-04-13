import '../../src/lib/i18n';

import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../src/context/AppContext';
import { CustomerBookingConfirmedPage } from '../../src/pages/customer/CustomerBookingConfirmedPage';
import { CustomerBookingDetailPage } from '../../src/pages/customer/CustomerBookingDetailPage';
import { CustomerBookingsPage } from '../../src/pages/customer/CustomerBookingsPage';
import { CustomerDisputeRaisePage } from '../../src/pages/customer/CustomerDisputeRaisePage';
import { CustomerDisputeStatusPage } from '../../src/pages/customer/CustomerDisputeStatusPage';
import { CustomerNoApplicantRescuePage } from '../../src/pages/customer/CustomerNoApplicantRescuePage';
import { CustomerNoShowReminderDialog } from '../../src/pages/customer/CustomerNoShowReminderDialog';
import { CustomerRebookPage } from '../../src/pages/customer/CustomerRebookPage';
import { CustomerReschedulePage } from '../../src/pages/customer/CustomerReschedulePage';
import { CustomerTimelinePage } from '../../src/pages/customer/CustomerTimelinePage';
import { createMockApiClient } from '../../src/test/mocks';
import { makeBooking, makeProfile, makeSession } from '../../src/test/factories';

function renderWithContext(ui: React.ReactElement, apiClient = createMockApiClient()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const contextValue: AppContextValue = {
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
  };

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={contextValue}>{ui}</AppContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function renderWithRoute(
  path: string,
  route: string,
  ui: React.ReactElement,
  apiClient = createMockApiClient(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const contextValue: AppContextValue = {
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
  };

  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={contextValue}>
          <Routes>
            <Route path={route} element={ui} />
          </Routes>
        </AppContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('Customer bookings phase 1 parity', () => {
  it('renders the customer bookings list and booking detail shell', async () => {
    const apiClient = createMockApiClient({
      listBookings: vi.fn().mockResolvedValue({
        data: [{ ...makeBooking(), id: 'booking-1', status: 'ASSIGNED' }],
        cursor: { next: null, has_more: false },
      }),
      getBooking: vi.fn().mockResolvedValue({ ...makeBooking(), id: 'booking-1' }),
    });

    const bookingsView = renderWithContext(<CustomerBookingsPage />, apiClient);

    expect(await screen.findByRole('heading', { name: 'Bookings' })).toBeInTheDocument();
    expect(await screen.findByText('booking-1')).toBeInTheDocument();
    bookingsView.unmount();

    const detailView = renderWithRoute(
      '/customer/bookings/booking-1',
      '/customer/bookings/:bookingId',
      <CustomerBookingDetailPage />,
      apiClient,
    );
    expect(await screen.findByRole('heading', { name: 'Booking detail' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Message tasker' })).toBeInTheDocument();
    detailView.unmount();
  });

  it('renders the booking confirmation and confirmed states', async () => {
    const apiClient = createMockApiClient({
      getBooking: vi.fn().mockResolvedValue({ ...makeBooking(), id: 'booking-1' }),
    });

    const confirmedView = renderWithContext(<CustomerBookingConfirmedPage />, apiClient);

    expect(await screen.findByRole('heading', { name: 'Booking confirmed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to bookings' })).toBeInTheDocument();
    confirmedView.unmount();
  });

  it('renders the timeline, reschedule, dispute, rescue, and rebook surfaces', async () => {
    const apiClient = createMockApiClient({
      getBooking: vi.fn().mockResolvedValue({ ...makeBooking(), id: 'booking-1' }),
    });

    const timelineView = renderWithContext(<CustomerTimelinePage />, apiClient);
    expect(await screen.findByRole('heading', { name: 'Booking timeline' })).toBeInTheDocument();
    timelineView.unmount();

    const rescheduleView = renderWithContext(<CustomerReschedulePage />, apiClient);
    expect(await screen.findByRole('heading', { name: 'Reschedule booking' })).toBeInTheDocument();
    rescheduleView.unmount();

    const disputeRaiseView = renderWithContext(<CustomerDisputeRaisePage />, apiClient);
    expect(await screen.findByRole('heading', { name: 'Raise dispute' })).toBeInTheDocument();
    disputeRaiseView.unmount();

    const disputeStatusView = renderWithContext(<CustomerDisputeStatusPage />, apiClient);
    expect(await screen.findByRole('heading', { name: 'Dispute status' })).toBeInTheDocument();
    disputeStatusView.unmount();

    const rescueView = renderWithContext(<CustomerNoApplicantRescuePage />, apiClient);
    expect(await screen.findByRole('heading', { name: 'No applicants yet' })).toBeInTheDocument();
    rescueView.unmount();

    const rebookView = renderWithContext(<CustomerRebookPage />, apiClient);
    expect(await screen.findByRole('heading', { name: 'Rebook task' })).toBeInTheDocument();
    rebookView.unmount();
  });

  it('renders the no-show reminder dialog', () => {
    const reminderView = renderWithContext(
      <CustomerNoShowReminderDialog open onOpenChange={vi.fn()} />,
      createMockApiClient(),
    );

    expect(screen.getByRole('dialog', { name: 'No-show reminder' })).toBeInTheDocument();
    reminderView.unmount();
  });
});
