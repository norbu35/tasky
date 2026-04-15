import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { makeFeatureToggle } from '../../../test/factories';
import { renderWithAppContext } from '../../../test/render-helpers';

// ── Mock sonner toast ────────────────────────────────────────────────
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

import { AdminFeaturesPage } from '../AdminFeaturesPage';

// ── Test Data ────────────────────────────────────────────────────────
const MOCK_TOGGLES = [
  makeFeatureToggle({
    feature_name: 'lead_fee_enabled',
    is_enabled: true,
    updated_at: '2026-03-20T10:30:00Z',
  }),
  makeFeatureToggle({
    feature_name: 'subscription_enabled',
    is_enabled: false,
    updated_at: '2026-03-19T14:00:00Z',
  }),
  makeFeatureToggle({
    feature_name: 'escrow_enabled',
    is_enabled: true,
    updated_at: '2026-03-18T09:15:00Z',
  }),
  makeFeatureToggle({
    feature_name: 'ai_scope_summary_enabled',
    is_enabled: false,
    updated_at: '2026-03-17T16:45:00Z',
  }),
];

// ── Helpers ──────────────────────────────────────────────────────────
const mockAdminListFeatureToggles = vi.fn();
const mockAdminUpdateFeatureToggle = vi.fn();

function renderPage() {
  return renderWithAppContext(<AdminFeaturesPage />, {
    adminApiClient: {
      adminListFeatureToggles: mockAdminListFeatureToggles,
      adminUpdateFeatureToggle: mockAdminUpdateFeatureToggle,
    },
  });
}

describe('AdminFeaturesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockAdminListFeatureToggles).mockResolvedValue(MOCK_TOGGLES);
    vi.mocked(mockAdminUpdateFeatureToggle).mockImplementation(
      async (_token: string, featureName: string, isEnabled: boolean) => ({
        feature_name: featureName,
        is_enabled: isEnabled,
        updated_by: 'admin@tasky.mn',
        updated_at: new Date().toISOString(),
      }),
    );
  });

  it('shows loading skeleton initially', () => {
    // Never resolve so we stay in loading state
    vi.mocked(mockAdminListFeatureToggles).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByTestId('features-loading')).toBeInTheDocument();
  });

  it('renders feature toggle list after load', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lead Fee')).toBeInTheDocument();
    });

    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Escrow Payments')).toBeInTheDocument();
    expect(screen.getByText('AI Scope Summary')).toBeInTheDocument();
  });

  it('each toggle shows name and switch in correct state', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lead Fee')).toBeInTheDocument();
    });

    // lead_fee_enabled is true -> switch should be checked
    const leadFeeRow = screen.getByTestId('toggle-row-lead_fee_enabled');
    const leadFeeSwitch = within(leadFeeRow).getByRole('switch');
    expect(leadFeeSwitch).toHaveAttribute('data-state', 'checked');

    // subscription_enabled is false -> switch should be unchecked
    const subRow = screen.getByTestId('toggle-row-subscription_enabled');
    const subSwitch = within(subRow).getByRole('switch');
    expect(subSwitch).toHaveAttribute('data-state', 'unchecked');
  });

  it('clicking switch shows confirmation dialog', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lead Fee')).toBeInTheDocument();
    });

    const leadFeeRow = screen.getByTestId('toggle-row-lead_fee_enabled');
    const leadFeeSwitch = within(leadFeeRow).getByRole('switch');

    fireEvent.click(leadFeeSwitch);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /confirm title/i })).toBeInTheDocument();
    });
  });

  it('confirming toggle calls adminUpdateFeatureToggle', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lead Fee')).toBeInTheDocument();
    });

    const leadFeeRow = screen.getByTestId('toggle-row-lead_fee_enabled');
    const leadFeeSwitch = within(leadFeeRow).getByRole('switch');

    fireEvent.click(leadFeeSwitch);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /confirm title/i })).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockAdminUpdateFeatureToggle).toHaveBeenCalledWith(
        'test-token',
        'lead_fee_enabled',
        false, // toggling from true to false
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('canceling confirmation does not call API', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lead Fee')).toBeInTheDocument();
    });

    const subRow = screen.getByTestId('toggle-row-subscription_enabled');
    const subSwitch = within(subRow).getByRole('switch');

    fireEvent.click(subSwitch);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /confirm title/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockAdminUpdateFeatureToggle).not.toHaveBeenCalled();
  });

  it('shows error state with retry', async () => {
    vi.mocked(mockAdminListFeatureToggles).mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/load error/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

    // Now fix the mock and retry
    vi.mocked(mockAdminListFeatureToggles).mockResolvedValue(MOCK_TOGGLES);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Lead Fee')).toBeInTheDocument();
    });
  });

  it('shows updated_at timestamp for each toggle', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lead Fee')).toBeInTheDocument();
    });

    // Verify that timestamp info is rendered for each toggle
    const leadFeeRow = screen.getByTestId('toggle-row-lead_fee_enabled');
    expect(within(leadFeeRow).getByText(/2026/)).toBeInTheDocument();

    const subRow = screen.getByTestId('toggle-row-subscription_enabled');
    expect(within(subRow).getByText(/2026/)).toBeInTheDocument();

    const escrowRow = screen.getByTestId('toggle-row-escrow_enabled');
    expect(within(escrowRow).getByText(/2026/)).toBeInTheDocument();

    const aiRow = screen.getByTestId('toggle-row-ai_scope_summary_enabled');
    expect(within(aiRow).getByText(/2026/)).toBeInTheDocument();
  });
});
