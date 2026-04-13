import type { AdminApiClient } from '../../../lib/adminApiClient';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient, StrikePolicy } from '../../../lib/apiClient';

const MOCK_POLICY: StrikePolicy = {
  strikeWindowDays: 28,
  strikeThreshold: 3,
  firstSuspensionDays: 7,
  repeatSuspensionDays: 30,
  repeatOffenseWindowDays: 90,
  autoUnsuspendEnabled: true,
  updatedAt: '2026-03-20T10:00:00Z',
};

const mockAdminApiClient: Partial<AdminApiClient> = {
  adminGetStrikePolicy: vi.fn(),
  adminUpdateStrikePolicy: vi.fn(),
};

const mockApiClient = {} as ApiClient;
vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    apiClient: mockApiClient,
    session: { accessToken: 'test-token', refreshToken: 'rt', user: { id: '1', role: 'ADMIN' } },
  })),
}));

vi.mock('../../../lib/adminApiClient', () => ({
  useAdminApiClient: () => mockAdminApiClient,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';
import { AdminModerationPage } from '../AdminModerationPage';

function renderPage() {
  return render(<AdminModerationPage />);
}

describe('AdminModerationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockAdminApiClient.adminGetStrikePolicy!).mockResolvedValue(MOCK_POLICY);
    vi.mocked(mockAdminApiClient.adminUpdateStrikePolicy!).mockResolvedValue({
      ...MOCK_POLICY,
      strikeThreshold: 2,
    });
  });

  it('fetches and displays current strike policy', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument(); // strikeWindowDays
    });

    expect(screen.getByText('3')).toBeInTheDocument(); // strikeThreshold
    expect(screen.getByText('7')).toBeInTheDocument(); // firstSuspensionDays
    expect(mockAdminApiClient.adminGetStrikePolicy).toHaveBeenCalledWith('test-token');
  });

  it('shows loading skeleton before data loads', () => {
    vi.mocked(mockAdminApiClient.adminGetStrikePolicy!).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByTestId('moderation-loading')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    vi.mocked(mockAdminApiClient.adminGetStrikePolicy!).mockRejectedValue(
      new Error('Server error'),
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/load error/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('clicking Edit switches fields to inputs', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Fields should now be inputs
    expect(screen.getByDisplayValue('28')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('Cancel discards edits and returns to read-only', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const input = screen.getByDisplayValue('28');
    fireEvent.change(input, { target: { value: '14' } });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Back to read-only with original value
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('14')).not.toBeInTheDocument();
  });

  it('Save calls adminUpdateStrikePolicy and shows toast', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Change strikeThreshold from 3 to 2
    const thresholdInput = screen.getByDisplayValue('3');
    fireEvent.change(thresholdInput, { target: { value: '2' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockAdminApiClient.adminUpdateStrikePolicy).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ strikeThreshold: 2 }),
      );
    });

    expect(toast.success).toHaveBeenCalled();
  });
});
