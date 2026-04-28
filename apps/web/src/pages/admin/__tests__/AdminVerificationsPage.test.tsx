import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { VerificationDetail } from '../../../lib/apiClient';
import i18n from '../../../lib/i18n';
import { AdminVerificationsPage } from '../AdminVerificationsPage';

// ── Mock AppContext ──────────────────────────────────────────────────
const mockAdminListPendingVerifications = vi.fn();
const mockAdminApproveVerification = vi.fn();
const mockAdminRejectVerification = vi.fn();

vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    session: {
      accessToken: 'test-admin-token',
      refreshToken: 'test-refresh',
      user: { id: 'admin-1', role: 'ADMIN' },
    },
  })),
}));

vi.mock('../../../lib/adminApiClient', () => ({
  useAdminApiClient: vi.fn(() => ({
    adminListPendingVerifications: mockAdminListPendingVerifications,
    adminApproveVerification: mockAdminApproveVerification,
    adminRejectVerification: mockAdminRejectVerification,
  })),
}));

// ── Test Data ────────────────────────────────────────────────────────
function makeVerification(overrides: Partial<VerificationDetail> = {}): VerificationDetail {
  return {
    id: 'v-1',
    user_id: 'u-1',
    user_phone: '+97699001122',
    user_name: 'Bold Bat',
    id_card_front_url: 'https://cdn.example.test/id-front.jpg',
    id_card_back_url: 'https://cdn.example.test/id-back.jpg',
    selfie_url: 'https://cdn.example.test/selfie.jpg',
    status: 'PENDING',
    admin_notes: null,
    submitted_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago => 18h left => green
    reviewed_at: null,
    ...overrides,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────
function renderPage() {
  return render(<AdminVerificationsPage />);
}

// ── Tests ────────────────────────────────────────────────────────────
describe('AdminVerificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));
    void i18n.changeLanguage('en');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Loading State ───────────────────────────────────────────────
  it('renders loading skeleton initially', () => {
    // Never resolve to keep loading state visible
    mockAdminListPendingVerifications.mockReturnValue(new Promise(() => {}));

    renderPage();

    // Should show skeleton elements while loading
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ─── Verification List ───────────────────────────────────────────
  it('renders verification list after load', async () => {
    const verifications = [
      makeVerification({ id: 'v-1', user_name: 'Bold Bat', user_phone: '+97699001122' }),
      makeVerification({ id: 'v-2', user_name: 'Sarnai Erdene', user_phone: '+97688009900' }),
    ];
    mockAdminListPendingVerifications.mockResolvedValue(verifications);

    renderPage();

    // Wait for data to load
    await screen.findByText('Bold Bat');
    expect(screen.getByText('Sarnai Erdene')).toBeInTheDocument();
    expect(screen.getByText('+97699001122')).toBeInTheDocument();
    expect(screen.getByText('+97688009900')).toBeInTheDocument();
  });

  // ─── SLA Countdown Color Coding ─────────────────────────────────
  it('shows SLA countdown with correct color coding', async () => {
    const now = new Date('2026-03-23T12:00:00Z');

    const greenVerification = makeVerification({
      id: 'v-green',
      user_name: 'Green User',
      submitted_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago => 18h left => green
    });
    const yellowVerification = makeVerification({
      id: 'v-yellow',
      user_name: 'Yellow User',
      submitted_at: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(), // 16h ago => 8h left => yellow
    });
    const redVerification = makeVerification({
      id: 'v-red',
      user_name: 'Red User',
      submitted_at: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(), // 22h ago => 2h left => red
    });
    const overdueVerification = makeVerification({
      id: 'v-overdue',
      user_name: 'Overdue User',
      submitted_at: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(), // 30h ago => -6h => overdue
    });

    mockAdminListPendingVerifications.mockResolvedValue([
      greenVerification,
      yellowVerification,
      redVerification,
      overdueVerification,
    ]);

    renderPage();

    // Wait for the list to render
    await screen.findByText('Green User');

    // Find SLA badges by their test IDs
    const greenBadge = screen.getByTestId('sla-badge-v-green');
    const yellowBadge = screen.getByTestId('sla-badge-v-yellow');
    const redBadge = screen.getByTestId('sla-badge-v-red');
    const overdueBadge = screen.getByTestId('sla-badge-v-overdue');

    // Check color classes
    expect(greenBadge.className).toMatch(/verified/);
    expect(yellowBadge.className).toMatch(/sun-wash|sun/);
    expect(redBadge.className).toMatch(/destructive/);
    expect(overdueBadge.textContent).toMatch(/overdue/i);
  });

  // ─── Expand Row for ID Card Images ──────────────────────────────
  it('expand row shows ID card images', async () => {
    const verification = makeVerification({
      id: 'v-1',
      user_name: 'Bold Bat',
      id_card_front_url: 'https://cdn.example.test/id-front.jpg',
      id_card_back_url: 'https://cdn.example.test/id-back.jpg',
      selfie_url: 'https://cdn.example.test/selfie.jpg',
    });
    mockAdminListPendingVerifications.mockResolvedValue([verification]);

    renderPage();

    await screen.findByText('Bold Bat');

    // Images should not be visible initially
    expect(screen.queryByAltText('ID Front')).not.toBeInTheDocument();

    // Click the row to expand
    const row = screen.getByTestId('verification-row-v-1');
    fireEvent.click(row);

    // Now images should be visible
    const frontImg = await screen.findByAltText('ID Front');
    const backImg = screen.getByAltText('ID Back');
    const selfieImg = screen.getByAltText('Selfie');

    expect(frontImg).toHaveAttribute('src', 'https://cdn.example.test/id-front.jpg');
    expect(backImg).toHaveAttribute('src', 'https://cdn.example.test/id-back.jpg');
    expect(selfieImg).toHaveAttribute('src', 'https://cdn.example.test/selfie.jpg');
  });

  // ─── Approve Verification ───────────────────────────────────────
  it('approve button calls adminApproveVerification', async () => {
    const verification = makeVerification({ id: 'v-1', user_name: 'Bold Bat' });
    mockAdminListPendingVerifications.mockResolvedValue([verification]);
    mockAdminApproveVerification.mockResolvedValue({
      ...verification,
      status: 'APPROVED',
      reviewed_at: new Date().toISOString(),
    });

    renderPage();

    await screen.findByText('Bold Bat');

    // Expand row first
    fireEvent.click(screen.getByTestId('verification-row-v-1'));

    // Click approve button
    const approveBtn = await screen.findByRole('button', { name: /approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mockAdminApproveVerification).toHaveBeenCalledWith('test-admin-token', 'v-1');
    });
  });

  // ─── Reject with Reason ─────────────────────────────────────────
  it('reject with reason calls adminRejectVerification', async () => {
    const verification = makeVerification({ id: 'v-1', user_name: 'Bold Bat' });
    mockAdminListPendingVerifications.mockResolvedValue([verification]);
    mockAdminRejectVerification.mockResolvedValue({
      ...verification,
      status: 'REJECTED',
      admin_notes: 'Blurry photo',
      reviewed_at: new Date().toISOString(),
    });

    renderPage();

    await screen.findByText('Bold Bat');

    // Expand row first
    fireEvent.click(screen.getByTestId('verification-row-v-1'));

    // Click reject button
    const rejectBtn = await screen.findByRole('button', { name: /reject/i });
    fireEvent.click(rejectBtn);

    // Should show text input for rejection reason
    const reasonInput = await screen.findByPlaceholderText(/reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Blurry photo' } });

    // Confirm rejection
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockAdminRejectVerification).toHaveBeenCalledWith(
        'test-admin-token',
        'v-1',
        'Blurry photo',
      );
    });
  });

  // ─── Empty State ─────────────────────────────────────────────────
  it('shows empty state when no pending verifications', async () => {
    mockAdminListPendingVerifications.mockResolvedValue([]);

    renderPage();

    await screen.findByText(/no pending verifications/i);
  });

  // ─── Error State with Retry ──────────────────────────────────────
  it('shows error state with retry button', async () => {
    mockAdminListPendingVerifications.mockRejectedValue(new Error('Network error'));

    renderPage();

    await screen.findByText(/network error/i);

    // There should be a retry button
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Click retry, this time succeed
    mockAdminListPendingVerifications.mockResolvedValue([
      makeVerification({ id: 'v-1', user_name: 'Bold Bat' }),
    ]);

    fireEvent.click(retryBtn);

    await screen.findByText('Bold Bat');
  });
});
