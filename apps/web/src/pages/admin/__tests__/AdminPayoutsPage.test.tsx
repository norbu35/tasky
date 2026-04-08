import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient, PayoutRequest, CursorPage } from '../../../lib/apiClient';

const MOCK_PAYOUTS: CursorPage<PayoutRequest> = {
  data: [
    {
      id: 'payout-1',
      user_id: 'tasker-1',
      amount: 150000,
      bank_name: 'Хаан банк',
      bank_account: '5012345678',
      status: 'PENDING',
      created_at: '2026-03-25T10:00:00Z',
      processed_at: null,
    },
    {
      id: 'payout-2',
      user_id: 'tasker-2',
      amount: 80000,
      bank_name: 'Голомт банк',
      bank_account: '4098765432',
      status: 'PENDING',
      created_at: '2026-03-25T11:00:00Z',
      processed_at: null,
    },
  ],
  cursor: { next: null, has_more: false },
};

const mockApiClient: Partial<ApiClient> = {
  adminListPendingPayouts: vi.fn(),
  adminProcessPayout: vi.fn(),
};

vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    apiClient: mockApiClient,
    session: { accessToken: 'test-token', refreshToken: 'rt', user: { id: '1', role: 'ADMIN' } },
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'idem-key-1234') });

import { toast } from 'sonner';
import { AdminPayoutsPage } from '../AdminPayoutsPage';

function renderPage() {
  return render(<AdminPayoutsPage />);
}

describe('AdminPayoutsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockResolvedValue(MOCK_PAYOUTS);
    vi.mocked(mockApiClient.adminProcessPayout!).mockResolvedValue({
      ...MOCK_PAYOUTS.data[0],
      status: 'PROCESSED',
      processed_at: '2026-03-25T12:00:00Z',
    });
  });

  it('shows loading skeleton on mount', () => {
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('payouts-loading')).toBeInTheDocument();
  });

  it('renders payout list after load', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Хаан банк')).toBeInTheDocument();
    });
    expect(screen.getByText('Голомт банк')).toBeInTheDocument();
    expect(screen.getByText('150,000')).toBeInTheDocument();
    expect(mockApiClient.adminListPendingPayouts).toHaveBeenCalledWith('test-token');
  });

  it('shows empty state when no payouts', async () => {
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockResolvedValue({
      data: [],
      cursor: { next: null, has_more: false },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/^empty$/i)).toBeInTheDocument();
    });
  });

  it('shows phase-gate info card on 503', async () => {
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockRejectedValue(
      Object.assign(new Error('Service Unavailable'), { status: 503 }),
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payouts-phase-gated')).toBeInTheDocument();
    });
  });

  it('shows error state on non-503 failure', async () => {
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/load error/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('clicking Process opens confirmation dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Хаан банк')).toBeInTheDocument();
    });
    const processButtons = screen.getAllByRole('button', { name: /process/i });
    fireEvent.click(processButtons[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /confirm title/i })).toBeInTheDocument();
  });

  it('confirming Process calls adminProcessPayout and removes row', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Хаан банк')).toBeInTheDocument();
    });
    const processButtons = screen.getAllByRole('button', { name: /process/i });
    fireEvent.click(processButtons[0]);
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(mockApiClient.adminProcessPayout).toHaveBeenCalledWith(
        'test-token',
        'payout-1',
        'idem-key-1234',
      );
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText('Хаан банк')).not.toBeInTheDocument();
    });
  });
});
