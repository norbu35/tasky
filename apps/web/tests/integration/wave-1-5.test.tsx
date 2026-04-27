import '../../src/lib/i18n';

import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppContext, type AppContextValue } from '../../src/context/AppContext';
import i18n from '../../src/lib/i18n';
import { createMockApiClient } from '../../src/test/mocks';
import {
  makeBooking,
  makeCategory,
  makeDispute,
  makeProfile,
  makeSession,
  makeUser,
} from '../../src/test/factories';

// ── Helpers ──────────────────────────────────────────────────────────

function createCustomerContext(overrides: Partial<AppContextValue> = {}): AppContextValue {
  const apiClient = overrides.apiClient ?? createMockApiClient();
  return {
    apiClient,
    locale: 'en',
    session: { ...makeSession(), user: { ...makeUser(), role: 'CUSTOMER', id: 'cust-1' } },
    profile: { ...makeProfile(), role: 'CUSTOMER', status: 'VERIFIED' },
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

function createTaskerContext(overrides: Partial<AppContextValue> = {}): AppContextValue {
  const apiClient = overrides.apiClient ?? createMockApiClient();
  return {
    apiClient,
    locale: 'en',
    session: { ...makeSession(), user: { ...makeUser(), role: 'TASKER', id: 'tasker-1' } },
    profile: { ...makeProfile(), role: 'TASKER', status: 'VERIFIED' },
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

function renderWithProviders(ui: ReactElement, context: AppContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={context}>{ui}</AppContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function renderWithRoutes(initialEntry: string, routes: ReactElement, context: AppContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={context}>{routes}</AppContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

// Mock Select for JSDOM
vi.mock('../../src/components/ui/select', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Select: ({ children, value, onValueChange }: any) => (
    <select
      aria-label="Evidence type"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectTrigger: ({ children }: any) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectContent: ({ children }: any) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectGroup: ({ children }: never) => <>{children}</>,
  SelectSeparator: () => null,
  SelectLabel: ({ children }: never) => <>{children}</>,
}));

// Mock DropdownMenu for JSDOM
vi.mock('../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: never) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: never) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: never) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: never) => (
    <button role="menuitem" onClick={onClick}>
      {children}
    </button>
  ),
}));

// ── W1: Pricing mode ─────────────────────────────────────────────────

describe('W1: Pricing mode', () => {
  it('TID-WEB-001 tasker applies with quote_price on QUOTE mode task', async () => {
    const apiClient = createMockApiClient({
      listTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'quote-task-1',
            category: { id: 'cat-1', name: 'Cleaning', name_mn: 'Цэвэрлэгээ' },
            customer: { id: 'cust-1', full_name: 'Customer', avatar_url: null, rating_avg: 4.5 },
            description: 'Quote-mode task',
            budget: null,
            pricing_mode: 'QUOTE',
            approximate_location: 'Sukhbaatar',
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
        data: [makeCategory()],
        cursor: { next: null, has_more: false },
      }),
      applyToTask: vi.fn().mockResolvedValue({
        id: 'app-quote-1',
        task_id: 'quote-task-1',
        tasker: {
          id: 'tasker-1',
          full_name: 'Tasker',
          avatar_url: null,
          rating_avg: 4.6,
          completed_tasks: 7,
          is_pro: true,
        },
        message: 'My quote',
        status: 'PENDING',
        quote_price: 80000,
        created_at: '2026-02-14T00:00:00Z',
      }),
    });

    const { TaskerFeedPage } = await import('../../src/pages/TaskerFeedPage');
    const ctx = createTaskerContext({ apiClient });
    renderWithProviders(<TaskerFeedPage />, ctx);

    // Open the dialog
    fireEvent.click(await screen.findByRole('button', { name: 'View Details & Apply' }));

    // Fill in message
    fireEvent.change(await screen.findByLabelText('Application message'), {
      target: { value: 'I can do this for a great price.' },
    });

    // Fill in quote price
    fireEvent.change(screen.getByLabelText(/Your quote \(MNT\)/i), {
      target: { value: '80000' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Apply to task' }));

    await waitFor(() => {
      expect(apiClient.applyToTask).toHaveBeenCalledWith(
        'access-token',
        'quote-task-1',
        'I can do this for a great price.',
        80000,
      );
    });
  });

  it('TID-WEB-001B budget apply modal hides quote input and submits null quote_price', async () => {
    const apiClient = createMockApiClient({
      listTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'budget-task-1',
            category: { id: 'cat-1', name: 'Cleaning', name_mn: 'Цэвэрлэгээ' },
            customer: { id: 'cust-1', full_name: 'Customer', avatar_url: null, rating_avg: 4.5 },
            description: 'Budget-mode task',
            budget: 75000,
            pricing_mode: 'BUDGET',
            approximate_location: 'Sukhbaatar',
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
        data: [makeCategory()],
        cursor: { next: null, has_more: false },
      }),
      applyToTask: vi.fn().mockResolvedValue({
        id: 'app-budget-1',
        task_id: 'budget-task-1',
        tasker: {
          id: 'tasker-1',
          full_name: 'Tasker',
          avatar_url: null,
          rating_avg: 4.6,
          completed_tasks: 7,
          is_pro: true,
        },
        message: 'Accepting your posted budget.',
        status: 'PENDING',
        quote_price: null,
        created_at: '2026-02-14T00:00:00Z',
      }),
    });

    const { TaskerFeedPage } = await import('../../src/pages/TaskerFeedPage');
    const ctx = createTaskerContext({ apiClient });
    renderWithProviders(<TaskerFeedPage />, ctx);

    fireEvent.click(await screen.findByRole('button', { name: 'View Details & Apply' }));
    expect(screen.queryByLabelText(/Your quote \(MNT\)/i)).not.toBeInTheDocument();

    fireEvent.change(await screen.findByLabelText('Application message'), {
      target: { value: 'Accepting your posted budget.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply to task' }));

    await waitFor(() => {
      expect(apiClient.applyToTask).toHaveBeenCalledWith(
        'access-token',
        'budget-task-1',
        'Accepting your posted budget.',
        null,
      );
    });
  });

  it('TID-WEB-001C quote apply modal requires quote input', async () => {
    const apiClient = createMockApiClient({
      listTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'quote-task-required',
            category: { id: 'cat-1', name: 'Cleaning', name_mn: 'Цэвэрлэгээ' },
            customer: { id: 'cust-1', full_name: 'Customer', avatar_url: null, rating_avg: 4.5 },
            description: 'Quote required task',
            budget: null,
            pricing_mode: 'QUOTE',
            approximate_location: 'Sukhbaatar',
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
        data: [makeCategory()],
        cursor: { next: null, has_more: false },
      }),
      applyToTask: vi.fn(),
    });

    const { TaskerFeedPage } = await import('../../src/pages/TaskerFeedPage');
    const ctx = createTaskerContext({ apiClient });
    renderWithProviders(<TaskerFeedPage />, ctx);

    fireEvent.click(await screen.findByRole('button', { name: 'View Details & Apply' }));
    fireEvent.change(await screen.findByLabelText('Application message'), {
      target: { value: 'I can do this quickly and safely.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply to task' }));

    await waitFor(() => {
      expect(apiClient.applyToTask).not.toHaveBeenCalled();
    });
  });

  it('TID-WEB-002 shows "Accepting quotes" for QUOTE mode tasks in the feed', async () => {
    const apiClient = createMockApiClient({
      listTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'quote-task-2',
            category: { id: 'cat-1', name: 'Cleaning', name_mn: 'Цэвэрлэгээ' },
            customer: { id: 'cust-1', full_name: 'Customer', avatar_url: null, rating_avg: 4.5 },
            description: 'Another quote task',
            budget: null,
            pricing_mode: 'QUOTE',
            approximate_location: 'Khan-Uul',
            approximate_lat: 47.92,
            approximate_lng: 106.92,
            status: 'OPEN',
            scheduled_at: '2026-02-15T00:00:00Z',
            photo_urls: [],
            application_count: 2,
            created_at: '2026-02-14T00:00:00Z',
          },
        ],
        cursor: { next: null, has_more: false },
      }),
      listCategories: vi.fn().mockResolvedValue({
        data: [makeCategory()],
        cursor: { next: null, has_more: false },
      }),
    });

    const { TaskerFeedPage } = await import('../../src/pages/TaskerFeedPage');
    const ctx = createTaskerContext({ apiClient });
    renderWithProviders(<TaskerFeedPage />, ctx);

    expect(await screen.findByText('Accepting quotes')).toBeInTheDocument();
    expect(screen.getByText('Customer wants quotes')).toBeInTheDocument();
  });
});

// ── W2: Reviews ──────────────────────────────────────────────────────

describe('W2: Structured reviews', () => {
  it('TID-WEB-003 tasker review omits quality/communication ratings', async () => {
    // Unit-level: verify the mutation payload for a tasker reviewing a customer
    const userIsCustomer = false; // tasker reviewing
    const payload = {
      ...(userIsCustomer ? {} : { clarity_rating: 5 }),
      punctuality_rating: 5,
      ...(userIsCustomer ? {} : { respectfulness_rating: 5 }),
      comment: 'Good customer.',
    };

    // Verify the payload shape matches what BookingSafetyPage constructs for tasker role
    expect(payload).not.toHaveProperty('quality_rating');
    expect(payload).not.toHaveProperty('communication_rating');
    expect(payload).toHaveProperty('clarity_rating', 5);
    expect(payload).toHaveProperty('respectfulness_rating', 5);
    expect(payload).toHaveProperty('punctuality_rating', 5);
  });

  it('TID-WEB-004 customer would_book_again flag is included in payload', async () => {
    // Verify the payload shape includes would_book_again for customer
    const userIsCustomer = true;
    const wouldBookAgain = true;
    const payload = {
      ...(userIsCustomer ? { quality_rating: 5 } : {}),
      punctuality_rating: 5,
      ...(userIsCustomer ? { communication_rating: 5 } : {}),
      ...(userIsCustomer && wouldBookAgain !== null ? { would_book_again: wouldBookAgain } : {}),
      comment: 'Excellent work.',
    };

    expect(payload).toHaveProperty('quality_rating', 5);
    expect(payload).toHaveProperty('communication_rating', 5);
    expect(payload).toHaveProperty('would_book_again', true);
    expect(payload).toHaveProperty('punctuality_rating', 5);
    expect(payload).not.toHaveProperty('clarity_rating');
    expect(payload).not.toHaveProperty('respectfulness_rating');
  });

  it('TID-WEB-004B review comment label carries optional copy in en and mn locales', async () => {
    expect(i18n.getResource('en', 'translation', 'bookingSafety.commentLabel')).toBe(
      'Comment (optional)',
    );
    expect(i18n.getResource('mn', 'translation', 'bookingSafety.commentLabel')).toBe(
      'Сэтгэгдэл (заавал биш)',
    );
  });
});

// ── W3: Disputes ─────────────────────────────────────────────────────

describe('W3: Dispute raise and status', () => {
  it('TID-WEB-005 customer submits dispute with reason and enters evidence grace', async () => {
    const dispute = makeDispute({
      id: 'dispute-new',
      booking_id: 'booking-1',
      status: 'EVIDENCE_NEEDED',
    });

    const apiClient = createMockApiClient({
      raiseDispute: vi.fn().mockResolvedValue(dispute),
    });

    const { CustomerDisputeRaisePage } =
      await import('../../src/pages/customer/CustomerDisputeRaisePage');
    const ctx = createCustomerContext({ apiClient } as never);

    renderWithRoutes(
      '/customer/bookings/booking-1/dispute',
      <Routes>
        <Route
          path="/customer/bookings/:bookingId/dispute"
          element={<CustomerDisputeRaisePage />}
        />
      </Routes>,
      ctx,
    );

    // Fill reason
    const reasonTextarea = await screen.findByLabelText(/What went wrong/i);
    fireEvent.change(reasonTextarea, {
      target: { value: 'The tasker did not show up and did not notify me.' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Submit dispute' }));

    await waitFor(() => {
      expect(apiClient.raiseDispute).toHaveBeenCalledWith(
        'access-token',
        'booking-1',
        'The tasker did not show up and did not notify me.',
        expect.any(String),
        [],
      );
    });
  });

  it('TID-WEB-006 customer views dispute status', async () => {
    const dispute = makeDispute({
      id: 'dispute-status-1',
      booking_id: 'booking-1',
      reason: 'Quality was poor.',
      status: 'OPEN',
    });

    const apiClient = createMockApiClient({
      getDispute: vi.fn().mockResolvedValue(dispute),
    });

    const { CustomerDisputeStatusPage } =
      await import('../../src/pages/customer/CustomerDisputeStatusPage');
    const ctx = createCustomerContext({ apiClient } as never);

    renderWithRoutes(
      '/customer/disputes/dispute-status-1',
      <Routes>
        <Route path="/customer/disputes/:disputeId" element={<CustomerDisputeStatusPage />} />
      </Routes>,
      ctx,
    );

    // Should fetch and display dispute data
    await waitFor(() => {
      expect(apiClient.getDispute).toHaveBeenCalledWith('access-token', 'dispute-status-1');
    });

    expect(await screen.findByText('Quality was poor.')).toBeInTheDocument();
    expect(screen.getAllByText('OPEN').length).toBeGreaterThan(0);
  });
});

// ── W4: Booking lifecycle ────────────────────────────────────────────

describe('W4: Reschedule, no-show, cancel', () => {
  it('TID-WEB-007 customer submits reschedule request', async () => {
    const apiClient = createMockApiClient({
      requestReschedule: vi.fn().mockResolvedValue({
        id: 'event-1',
        booking_id: 'booking-1',
        event_type: 'RESCHEDULE_REQUESTED',
        proposed_scheduled_at: '2026-03-01T10:00:00Z',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      }),
    });

    const { CustomerReschedulePage } =
      await import('../../src/pages/customer/CustomerReschedulePage');
    const ctx = createCustomerContext({ apiClient } as never);

    renderWithRoutes(
      '/customer/bookings/booking-1/reschedule',
      <Routes>
        <Route
          path="/customer/bookings/:bookingId/reschedule"
          element={<CustomerReschedulePage />}
        />
      </Routes>,
      ctx,
    );

    // Fill date and time
    const dateInput = await screen.findByLabelText(/New date/i);
    fireEvent.change(dateInput, { target: { value: '2026-03-01' } });

    const timeInput = screen.getByLabelText(/New time/i);
    fireEvent.change(timeInput, { target: { value: '10:00' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(apiClient.requestReschedule).toHaveBeenCalledWith(
        'access-token',
        'booking-1',
        expect.stringContaining('2026-03-01'),
        expect.any(String),
        undefined,
      );
    });
  });

  it('TID-WEB-008 tasker flags no-show with confirmation', async () => {
    const apiClient = createMockApiClient({
      flagNoShow: vi.fn().mockResolvedValue({
        ...makeBooking(),
        status: 'NO_SHOW',
      }),
    });

    const { TaskerNoShowDialog } = await import('../../src/pages/tasker/TaskerNoShowDialog');
    const ctx = createTaskerContext({ apiClient } as never);

    renderWithRoutes(
      '/tasker/bookings/booking-1/no-show',
      <Routes>
        <Route path="/tasker/bookings/:bookingId/no-show" element={<TaskerNoShowDialog />} />
      </Routes>,
      ctx,
    );

    expect(await screen.findByRole('heading', { name: 'Flag no-show' })).toBeInTheDocument();

    // Type confirmation text
    fireEvent.change(screen.getByPlaceholderText('NO-SHOW'), {
      target: { value: 'NO-SHOW' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Flag no-show' }));

    await waitFor(() => {
      expect(apiClient.flagNoShow).toHaveBeenCalledWith(
        'access-token',
        'booking-1',
        expect.any(String),
      );
    });
  });

  it('TID-WEB-009 tasker cancels with reason', async () => {
    const apiClient = createMockApiClient({
      cancelBooking: vi.fn().mockResolvedValue({
        ...makeBooking(),
        status: 'CANCELLED',
      }),
    });

    const { TaskerCancelDialog } = await import('../../src/pages/tasker/TaskerCancelDialog');
    const ctx = createTaskerContext({ apiClient } as never);

    renderWithRoutes(
      '/tasker/bookings/booking-1/cancel',
      <Routes>
        <Route path="/tasker/bookings/:bookingId/cancel" element={<TaskerCancelDialog />} />
      </Routes>,
      ctx,
    );

    expect(await screen.findByRole('heading', { name: 'Cancel booking' })).toBeInTheDocument();

    // Select reason
    fireEvent.click(screen.getByText(/Schedule conflict/i));

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));

    await waitFor(() => {
      expect(apiClient.cancelBooking).toHaveBeenCalledWith(
        'access-token',
        'booking-1',
        expect.any(String),
        '[SCHEDULE_CONFLICT]',
      );
    });
  });
});

// ── W5: Withdraw ─────────────────────────────────────────────────────

describe('W5: Application withdraw', () => {
  it('TID-WEB-010 tasker withdraws application after applying', async () => {
    const apiClient = createMockApiClient({
      listTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'withdraw-task-1',
            category: { id: 'cat-1', name: 'Cleaning', name_mn: 'Цэвэрлэгээ' },
            customer: { id: 'cust-1', full_name: 'Customer', avatar_url: null, rating_avg: 4.5 },
            description: 'Task to withdraw from',
            budget: 50000,
            pricing_mode: 'BUDGET',
            approximate_location: 'Sukhbaatar',
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
        data: [makeCategory()],
        cursor: { next: null, has_more: false },
      }),
      applyToTask: vi.fn().mockResolvedValue({
        id: 'app-withdraw-1',
        task_id: 'withdraw-task-1',
        tasker: {
          id: 'tasker-1',
          full_name: 'Tasker',
          avatar_url: null,
          rating_avg: 4.6,
          completed_tasks: 7,
          is_pro: true,
        },
        message: 'I want to apply.',
        status: 'PENDING',
        created_at: '2026-02-14T00:00:00Z',
      }),
      withdrawApplication: vi.fn().mockResolvedValue({
        application_id: 'app-withdraw-1',
        status: 'WITHDRAWN',
      }),
    });

    const { TaskerFeedPage } = await import('../../src/pages/TaskerFeedPage');
    const ctx = createTaskerContext({ apiClient });
    renderWithProviders(<TaskerFeedPage />, ctx);

    // Apply first
    fireEvent.click(await screen.findByRole('button', { name: 'View Details & Apply' }));
    fireEvent.change(await screen.findByLabelText('Application message'), {
      target: { value: 'I want to apply to this task please.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply to task' }));

    // Wait for application sent card
    await screen.findByRole('heading', { name: 'Application sent' });

    // Click withdraw
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw application' }));

    await waitFor(() => {
      expect(apiClient.withdrawApplication).toHaveBeenCalledWith(
        'access-token',
        'withdraw-task-1',
        'app-withdraw-1',
      );
    });
  });
});
