import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient, LeadUnlockPrice, CursorPage } from '../../../lib/apiClient';

const MOCK_PRICES: CursorPage<LeadUnlockPrice> = {
  data: [
    {
      id: 'price-1',
      category_id: 'cat-cleaning',
      district_id: 'khan-uul',
      credits_required: 5,
      effective_from: '2026-03-01T00:00:00Z',
      effective_to: null,
    },
    {
      id: 'price-2',
      category_id: 'cat-moving',
      district_id: 'bayangol',
      credits_required: 8,
      effective_from: '2026-03-15T00:00:00Z',
      effective_to: '2026-06-01T00:00:00Z',
    },
  ],
  cursor: { next: null, prev: null },
};

const mockApiClient: Partial<ApiClient> = {
  adminListLeadUnlockPrices: vi.fn(),
  adminCreateLeadUnlockPrice: vi.fn(),
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

import { toast } from 'sonner';
import { AdminLeadPricingPage } from '../AdminLeadPricingPage';

function renderPage() {
  return render(<AdminLeadPricingPage />);
}

describe('AdminLeadPricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockResolvedValue(MOCK_PRICES);
    vi.mocked(mockApiClient.adminCreateLeadUnlockPrice!).mockResolvedValue({
      id: 'price-3',
      category_id: 'cat-repair',
      district_id: 'sukhbaatar',
      credits_required: 3,
      effective_from: '2026-04-01T00:00:00Z',
      effective_to: null,
    });
  });

  it('shows loading skeleton on mount', () => {
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('pricing-loading')).toBeInTheDocument();
  });

  it('renders price list after load', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('cat-cleaning')).toBeInTheDocument();
    });
    expect(screen.getByText('khan-uul')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('cat-moving')).toBeInTheDocument();
    expect(mockApiClient.adminListLeadUnlockPrices).toHaveBeenCalledWith('test-token');
  });

  it('shows empty state when no prices', async () => {
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockResolvedValue({
      data: [],
      cursor: { next: null, prev: null },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no prices/i)).toBeInTheDocument();
    });
  });

  it('shows phase-gate info card on 503', async () => {
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockRejectedValue(
      Object.assign(new Error('Service Unavailable'), { status: 503 }),
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('pricing-phase-gated')).toBeInTheDocument();
    });
  });

  it('shows error state on non-503 failure', async () => {
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('Create Price button opens dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('cat-cleaning')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /create price/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('submitting the create form calls adminCreateLeadUnlockPrice', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('cat-cleaning')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create price/i }));

    fireEvent.change(screen.getByPlaceholderText(/category/i), {
      target: { value: 'cat-repair' },
    });
    fireEvent.change(screen.getByPlaceholderText(/district/i), {
      target: { value: 'sukhbaatar' },
    });
    fireEvent.change(screen.getByPlaceholderText(/credits/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByPlaceholderText(/effective from/i), {
      target: { value: '2026-04-01T00:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockApiClient.adminCreateLeadUnlockPrice).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          category_id: 'cat-repair',
          district_id: 'sukhbaatar',
          credits_required: 3,
        }),
      );
    });

    expect(toast.success).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('cat-repair')).toBeInTheDocument();
    });
  });
});
