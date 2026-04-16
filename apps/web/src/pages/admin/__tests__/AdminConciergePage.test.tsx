import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { AdminApiClient } from '../../../lib/adminApiClient';
import type { ApiClient, PublicTask, User, Booking, CursorPage } from '../../../lib/apiClient';
import { AdminConciergePage } from '../AdminConciergePage';

// ── Mock AppContext ──────────────────────────────────────────────────
const mockAdminApiClient: Partial<AdminApiClient> = {
  adminConciergeAssignTask: vi.fn(),
  adminSearchUsers: vi.fn(),
};
const mockApiClient: Partial<ApiClient> = {
  listTasks: vi.fn(),
};
vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    apiClient: mockApiClient,
    session: {
      accessToken: 'test-token',
      refreshToken: 'rt',
      user: { id: 'admin-1', role: 'ADMIN' },
    },
  })),
}));

vi.mock('../../../lib/adminApiClient', () => ({
  useAdminApiClient: () => mockAdminApiClient,
}));

// ── Mock sonner toast ────────────────────────────────────────────────
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Mock crypto.randomUUID for idempotency keys ─────────────────────
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-1234'),
});

// ── Test Data ────────────────────────────────────────────────────────
const MOCK_TASKS: CursorPage<PublicTask> = {
  data: [
    {
      id: 'task-1',
      category: {
        id: 'cat-1',
        name: 'Cleaning',
        name_mn: 'Цэвэрлэгээ',
        icon_url: '',
        is_active: true,
        sort_order: 1,
        intake_enabled: false,
        intake_schema_version: 0,
      },
      customer: { id: 'cust-1', full_name: 'Customer One', avatar_url: null, rating_avg: 4.5 },
      description: 'Clean my apartment',
      budget: 50000,
      approximate_location: 'Khan-Uul, 15th khoroo',
      status: 'OPEN',
      scheduled_at: '2026-03-25T10:00:00Z',
      photo_urls: [],
      application_count: 0,
      created_at: '2026-03-23T08:00:00Z',
    },
    {
      id: 'task-2',
      category: {
        id: 'cat-2',
        name: 'Moving',
        name_mn: 'Нүүлгэлт',
        icon_url: '',
        is_active: true,
        sort_order: 2,
        intake_enabled: false,
        intake_schema_version: 0,
      },
      customer: { id: 'cust-2', full_name: 'Customer Two', avatar_url: null, rating_avg: 3.8 },
      description: 'Help me move furniture',
      budget: 80000,
      approximate_location: 'Bayangol, 3rd khoroo',
      status: 'OPEN',
      scheduled_at: '2026-03-26T14:00:00Z',
      photo_urls: [],
      application_count: 2,
      created_at: '2026-03-22T10:00:00Z',
    },
  ],
  cursor: { next: null, has_more: false },
};

const MOCK_TASKER_USERS: CursorPage<User> = {
  data: [
    {
      id: 'tasker-1',
      phone: '+97699001122',
      facebook_id: null,
      primary_auth: 'PHONE_OTP',
      role: 'TASKER',
      status: 'VERIFIED',
      created_at: '2026-01-15T00:00:00Z',
    },
    {
      id: 'customer-1',
      phone: '+97699003344',
      facebook_id: null,
      primary_auth: 'PHONE_OTP',
      role: 'CUSTOMER',
      status: 'VERIFIED',
      created_at: '2026-02-10T00:00:00Z',
    },
  ],
  cursor: { next: null, has_more: false },
};

const MOCK_BOOKING: Booking = {
  id: 'booking-1',
  task_id: 'task-1',
  tasker_id: 'tasker-1',
  customer_id: 'cust-1',
  price: 50000,
  status: 'ASSIGNED',
  confirmed_scheduled_at: '2026-03-25T10:00:00Z',
  liability_disclaimer_accepted: true,
  created_at: '2026-03-23T12:00:00Z',
} as Booking;

// ── Helpers ──────────────────────────────────────────────────────────
function renderPage() {
  return render(<AdminConciergePage />);
}

describe('AdminConciergePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockApiClient.listTasks!).mockResolvedValue(MOCK_TASKS);
    vi.mocked(mockAdminApiClient.adminSearchUsers!).mockResolvedValue(MOCK_TASKER_USERS);
    vi.mocked(mockAdminApiClient.adminConciergeAssignTask!).mockResolvedValue(MOCK_BOOKING);
  });

  it('renders open tasks list', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Clean my apartment')).toBeInTheDocument();
    });

    expect(screen.getByText('Help me move furniture')).toBeInTheDocument();
    expect(mockApiClient.listTasks).toHaveBeenCalledWith('test-token');
  });

  it('selecting a task highlights it', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Clean my apartment')).toBeInTheDocument();
    });

    const taskRow = screen.getByTestId('task-row-task-1');
    fireEvent.click(taskRow);

    expect(taskRow).toHaveAttribute('data-selected', 'true');
  });

  it('search for tasker by phone', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Clean my apartment')).toBeInTheDocument();
    });

    const phoneInput = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '+97699001122' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockAdminApiClient.adminSearchUsers).toHaveBeenCalledWith(
        'test-token',
        '+97699001122',
      );
    });
  });

  it('displays tasker search results filtered to TASKER role', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Clean my apartment')).toBeInTheDocument();
    });

    const phoneInput = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '+976990' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      // Should show the TASKER user
      expect(screen.getByTestId('user-row-tasker-1')).toBeInTheDocument();
    });

    // Should NOT show the CUSTOMER user
    expect(screen.queryByTestId('user-row-customer-1')).not.toBeInTheDocument();
  });

  it('assign button disabled without task, tasker, reason, or disclaimer', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Clean my apartment')).toBeInTheDocument();
    });

    const assignButton = screen.getByRole('button', { name: /assign/i });

    // Nothing selected -> disabled
    expect(assignButton).toBeDisabled();

    // Select task
    fireEvent.click(screen.getByTestId('task-row-task-1'));

    // Still disabled - no tasker
    expect(assignButton).toBeDisabled();

    // Search and select tasker
    const phoneInput = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '+97699001122' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('user-row-tasker-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('user-row-tasker-1'));

    // Still disabled - no reason
    expect(assignButton).toBeDisabled();

    // Enter reason (too short)
    const reasonInput = screen.getByPlaceholderText(/reason/i);
    fireEvent.change(reasonInput, { target: { value: 'ab' } });

    // Still disabled - reason too short (min 3 chars)
    expect(assignButton).toBeDisabled();

    // Enter valid reason
    fireEvent.change(reasonInput, { target: { value: 'Low liquidity period' } });

    // Still disabled - disclaimer not checked
    expect(assignButton).toBeDisabled();

    // Check disclaimer
    const disclaimer = screen.getByRole('checkbox');
    fireEvent.click(disclaimer);

    // Now enabled
    expect(assignButton).toBeEnabled();
  });

  it('successful assignment calls adminConciergeAssignTask', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Clean my apartment')).toBeInTheDocument();
    });

    // Select task
    fireEvent.click(screen.getByTestId('task-row-task-1'));

    // Search and select tasker
    const phoneInput = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '+97699001122' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('user-row-tasker-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('user-row-tasker-1'));

    // Fill reason
    const reasonInput = screen.getByPlaceholderText(/reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Low liquidity period' } });

    // Check disclaimer
    const disclaimer = screen.getByRole('checkbox');
    fireEvent.click(disclaimer);

    // Click assign
    const assignButton = screen.getByRole('button', { name: /assign/i });
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(mockAdminApiClient.adminConciergeAssignTask).toHaveBeenCalledWith(
        'test-token',
        'task-1',
        'tasker-1',
        'Low liquidity period',
        true,
        'test-uuid-1234',
      );
    });
  });

  it('shows success state after assignment', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Clean my apartment')).toBeInTheDocument();
    });

    // Select task
    fireEvent.click(screen.getByTestId('task-row-task-1'));

    // Search and select tasker
    const phoneInput = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '+97699001122' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('user-row-tasker-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('user-row-tasker-1'));

    // Fill reason and disclaimer
    fireEvent.change(screen.getByPlaceholderText(/reason/i), {
      target: { value: 'Low liquidity period' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    // Assign
    fireEvent.click(screen.getByRole('button', { name: /assign/i }));

    await waitFor(() => {
      expect(screen.getByTestId('assignment-success')).toBeInTheDocument();
    });

    // Should show booking ID
    expect(screen.getByText(/booking-1/i)).toBeInTheDocument();
  });

  it('shows error state when task loading fails', async () => {
    vi.mocked(mockApiClient.listTasks!).mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/load error/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows error when assignment fails', async () => {
    vi.mocked(mockAdminApiClient.adminConciergeAssignTask!).mockRejectedValue(
      new Error('Conflict'),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Clean my apartment')).toBeInTheDocument();
    });

    // Select task
    fireEvent.click(screen.getByTestId('task-row-task-1'));

    // Search and select tasker
    const phoneInput = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '+97699001122' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('user-row-tasker-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('user-row-tasker-1'));

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/reason/i), {
      target: { value: 'Low liquidity period' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    // Assign
    fireEvent.click(screen.getByRole('button', { name: /assign/i }));

    await waitFor(() => {
      expect(screen.getByTestId('assignment-error')).toBeInTheDocument();
    });
  });
});
