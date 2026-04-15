import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { AppContext } from '../../../context/AppContext';
import type { AppContextValue } from '../../../context/AppContext';
import { type AdminApiClient, AdminApiClientContext } from '../../../lib/adminApiClient';
import type {
  ApiClient,
  CursorPage,
  AdminDisputeDetail,
  Dispute,
  Booking,
  Message,
} from '../../../lib/apiClient';
import { AdminDisputeDetailPage } from '../AdminDisputeDetailPage';
import { AdminDisputesPage } from '../AdminDisputesPage';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const DISPUTE_1: Dispute = {
  id: 'd-001',
  booking_id: 'b-001',
  raised_by: 'u-customer-1',
  reason: 'Tasker did not show up on the scheduled date and refuses to reschedule',
  status: 'OPEN',
  created_at: '2026-03-20T10:00:00Z',
};

const DISPUTE_2: Dispute = {
  id: 'd-002',
  booking_id: 'b-002',
  raised_by: 'u-customer-2',
  reason: 'Work quality was poor',
  status: 'OPEN',
  created_at: '2026-03-21T14:30:00Z',
};

const BOOKING_1: Booking = {
  id: 'b-001',
  task_id: 't-001',
  tasker_id: 'u-tasker-1',
  customer_id: 'u-customer-1',
  price: 50000,
  status: 'ASSIGNED',
  confirmed_scheduled_at: '2026-03-18T09:00:00Z',
  created_at: '2026-03-15T08:00:00Z',
  task: {
    id: 't-001',
    category_id: 'cat-1',
    customer_id: 'u-customer-1',
    description: 'Fix the leaking kitchen faucet and replace washers',
    budget: 50000,
    location_lat: 47.9,
    location_lng: 106.9,
    location_text: 'Ulaanbaatar, Khan-Uul',
    scheduled_at: '2026-03-18T09:00:00Z',
    status: 'ASSIGNED',
    created_at: '2026-03-14T12:00:00Z',
  } as Record<string, unknown> as Booking['task'],
  customer: {
    user_id: 'u-customer-1',
    full_name: 'Bold Batbayar',
  } as Record<string, unknown> as NonNullable<Booking['customer']>,
  tasker: {
    user_id: 'u-tasker-1',
    full_name: 'Ganzorig Munkh',
  } as Record<string, unknown> as NonNullable<Booking['tasker']>,
};

const EVIDENCE_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'u-customer-1',
    content: 'When will you arrive? You were supposed to be here at 9.',
    created_at: '2026-03-18T09:30:00Z',
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_id: 'u-tasker-1',
    content: 'Sorry, I cannot make it today.',
    created_at: '2026-03-18T10:00:00Z',
  },
];

const DISPUTE_DETAIL: AdminDisputeDetail = {
  dispute: DISPUTE_1 as unknown as Record<string, unknown>,
  booking: BOOKING_1 as unknown as Record<string, unknown>,
  conversation_id: 'conv-1',
  evidence_messages: EVIDENCE_MESSAGES as unknown[],
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function createMockAdminApiClient(
  overrides: Partial<ApiClient & AdminApiClient> = {},
): ApiClient & AdminApiClient {
  return {
    adminListDisputes: vi.fn().mockResolvedValue({
      data: [DISPUTE_1, DISPUTE_2],
      cursor: { next: null, has_more: false },
    } satisfies CursorPage<Dispute>),
    adminGetDispute: vi.fn().mockResolvedValue(DISPUTE_DETAIL),
    adminResolveDispute: vi.fn().mockResolvedValue({
      ...DISPUTE_1,
      status: 'RESOLVED',
      resolution_action: 'RESOLVE_CUSTOMER',
    }),
    ...overrides,
  } as unknown as ApiClient & AdminApiClient;
}

function createAppContext(apiClient: ApiClient): AppContextValue {
  return {
    apiClient,
    locale: 'en',
    session: {
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      user: {
        id: 'admin-1',
        phone: '99001122',
        role: 'ADMIN',
      } as AppContextValue['session'] extends { user: infer U } ? U : never,
    } as AppContextValue['session'],
    profile: null,
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
}

function renderListPage(apiClient: ApiClient) {
  const ctx = createAppContext(apiClient);
  return render(
    <AppContext.Provider value={ctx}>
      <AdminApiClientContext.Provider value={apiClient as unknown as AdminApiClient}>
        <MemoryRouter initialEntries={['/admin/disputes']}>
          <Routes>
            <Route path="/admin/disputes" element={<AdminDisputesPage />} />
            <Route path="/admin/disputes/:id" element={<AdminDisputeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AdminApiClientContext.Provider>
    </AppContext.Provider>,
  );
}

function renderDetailPage(apiClient: ApiClient, disputeId = 'd-001') {
  const ctx = createAppContext(apiClient);
  return render(
    <AppContext.Provider value={ctx}>
      <AdminApiClientContext.Provider value={apiClient as unknown as AdminApiClient}>
        <MemoryRouter initialEntries={[`/admin/disputes/${disputeId}`]}>
          <Routes>
            <Route path="/admin/disputes" element={<AdminDisputesPage />} />
            <Route path="/admin/disputes/:id" element={<AdminDisputeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AdminApiClientContext.Provider>
    </AppContext.Provider>,
  );
}

// ─── Tests: AdminDisputesPage (List) ───────────────────────────────────────

describe('AdminDisputesPage', () => {
  it('renders dispute list after load', async () => {
    const api = createMockAdminApiClient();
    renderListPage(api);

    await waitFor(() => {
      expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Work quality was poor/)).toBeInTheDocument();
    expect(api.adminListDisputes).toHaveBeenCalledWith('test-token');
  });

  it('clicking a dispute row navigates to detail page', async () => {
    const api = createMockAdminApiClient();
    renderListPage(api);

    await waitFor(() => {
      expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const row =
      screen.getByText(/Tasker did not show up/).closest('tr') ??
      screen.getByText(/Tasker did not show up/).closest("[data-testid='dispute-row']") ??
      screen.getByText(/Tasker did not show up/);
    await user.click(row!);

    // Should navigate to detail — detail page should load
    await waitFor(() => {
      expect(api.adminGetDispute).toHaveBeenCalledWith('test-token', 'd-001');
    });
  });

  it('shows empty state when no disputes', async () => {
    const api = createMockAdminApiClient({
      adminListDisputes: vi.fn().mockResolvedValue({
        data: [],
        cursor: { next: null, has_more: false },
      }),
    });
    renderListPage(api);

    await waitFor(() => {
      expect(screen.getByText(/^empty$/i)).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    const api = createMockAdminApiClient({
      adminListDisputes: vi.fn().mockRejectedValue(new Error('Network error')),
    });
    renderListPage(api);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('renders status badges for disputes', async () => {
    const api = createMockAdminApiClient();
    renderListPage(api);

    await waitFor(() => {
      expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
    });

    // Both disputes have status OPEN
    const badges = screen.getAllByText('OPEN');
    expect(badges).toHaveLength(2);
  });
});

// ─── Tests: AdminDisputeDetailPage ─────────────────────────────────────────

describe('AdminDisputeDetailPage', () => {
  it('shows dispute info and booking context', async () => {
    const api = createMockAdminApiClient();
    renderDetailPage(api);

    await waitFor(() => {
      expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
    });

    // Dispute status
    expect(screen.getByText('OPEN')).toBeInTheDocument();

    // Booking context
    expect(screen.getByText(/Fix the leaking kitchen faucet/)).toBeInTheDocument();
    expect(screen.getByText(/50,?000/)).toBeInTheDocument();
    expect(screen.getByText(/Bold Batbayar/)).toBeInTheDocument();
    expect(screen.getByText(/Ganzorig Munkh/)).toBeInTheDocument();
  });

  it('shows evidence messages', async () => {
    const api = createMockAdminApiClient();
    renderDetailPage(api);

    await waitFor(() => {
      expect(screen.getByText(/When will you arrive/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Sorry, I cannot make it today/)).toBeInTheDocument();
  });

  it('resolve for customer calls adminResolveDispute with RESOLVE_CUSTOMER', async () => {
    const api = createMockAdminApiClient();
    renderDetailPage(api);

    await waitFor(() => {
      expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Fill in mandatory notes
    const notesInput = screen.getByPlaceholderText(/notes/i);
    await user.type(notesInput, 'Customer claim is valid based on evidence');

    // Click resolve for customer
    const resolveBtn = screen.getByRole('button', { name: /resolve customer/i });
    await user.click(resolveBtn);

    await waitFor(() => {
      expect(api.adminResolveDispute).toHaveBeenCalledWith(
        'test-token',
        'd-001',
        'RESOLVE_CUSTOMER',
        'Customer claim is valid based on evidence',
        expect.any(String), // idempotency key
      );
    });
  });

  it('resolve requires notes — shows validation error without notes', async () => {
    const api = createMockAdminApiClient();
    renderDetailPage(api);

    await waitFor(() => {
      expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Click resolve without filling notes
    const resolveBtn = screen.getByRole('button', { name: /resolve customer/i });
    await user.click(resolveBtn);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/notes required/i)).toBeInTheDocument();
    });

    // Should NOT call the API
    expect(api.adminResolveDispute).not.toHaveBeenCalled();
  });

  it('back button navigates to dispute list', async () => {
    const api = createMockAdminApiClient();
    renderDetailPage(api);

    await waitFor(() => {
      expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const backBtn =
      screen.getByRole('button', { name: /back/i }) ?? screen.getByRole('link', { name: /back/i });
    await user.click(backBtn!);

    // Should navigate back to the list page
    await waitFor(() => {
      expect(api.adminListDisputes).toHaveBeenCalled();
    });
  });

  it('shows loading state while fetching', () => {
    const api = createMockAdminApiClient({
      adminGetDispute: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    });
    renderDetailPage(api);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    const api = createMockAdminApiClient({
      adminGetDispute: vi.fn().mockRejectedValue(new Error('Server error')),
    });
    renderDetailPage(api);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
